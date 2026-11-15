/* Supabase connection and data helpers for the static TravelSphere frontend. */
(function () {
  const config = window.TRAVELSPHERE_SUPABASE_CONFIG || {};
  const configured = Boolean(config.url && config.publishableKey && window.supabase?.createClient);
  const client = configured
    ? window.supabase.createClient(config.url, config.publishableKey)
    : null;

  const cacheSession = (user) => {
    if (!user) {
      localStorage.removeItem('ts-session');
      return null;
    }
    const profile = user.user_metadata || {};
    const session = {
      signedIn: true,
      id: user.id,
      name: profile.first_name || profile.firstName || user.email?.split('@')[0] || 'Explorer',
      email: user.email || '',
      userKey: user.id
    };
    localStorage.setItem('ts-session', JSON.stringify(session));
    return session;
  };

  const ready = (async () => {
    if (!configured) {
      localStorage.removeItem('ts-session');
      return { configured: false, session: null };
    }
    const { data, error } = await client.auth.getSession();
    if (error) console.error('Could not restore Supabase session:', error.message);
    return { configured: true, session: cacheSession(data?.session?.user || null) };
  })();

  if (configured) {
    client.auth.onAuthStateChange((_event, session) => {
      cacheSession(session?.user || null);
      window.dispatchEvent(new CustomEvent('travel-sphere-auth-change'));
    });
  }

  const handle = async (result) => {
    if (result.error) throw result.error;
    return result.data;
  };

  window.tsBackend = {
    configured,
    client,
    ready,
    async signUp({ email, password, firstName, lastName }) {
      if (!configured) throw new Error('Connect Supabase before creating accounts.');
      return handle(await client.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName, last_name: lastName } }
      }));
    },
    async signIn(email, password) {
      if (!configured) throw new Error('Connect Supabase before signing in.');
      return handle(await client.auth.signInWithPassword({ email, password }));
    },
    async signOut() {
      if (!configured) return;
      await handle(await client.auth.signOut());
      cacheSession(null);
    },
    async loadProfile() {
      if (!configured) return null;
      const { data: { user } } = await client.auth.getUser();
      if (!user) return null;
      const result = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (result.error) throw result.error;
      return result.data;
    },
    async saveProfile(profile) {
      if (!configured) throw new Error('Connect Supabase before saving a profile.');
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error('Please sign in again to save your profile.');
      const result = await client.from('profiles').upsert({
        id: user.id,
        first_name: profile.first || '',
        last_name: profile.last || '',
        phone: profile.phone || '',
        email: user.email
      }).select().single();
      if (result.error) throw result.error;
      await client.auth.updateUser({ data: { first_name: profile.first || '', last_name: profile.last || '' } });
      return result.data;
    },
    async savePreferences(preferences) {
      if (!configured) throw new Error('Connect Supabase before saving preferences.');
      const { data: { user } } = await client.auth.getUser();
      if (!user) throw new Error('Please sign in again to save preferences.');
      const result = await client.from('profiles').upsert({
        id: user.id,
        email: user.email,
        preferred_currency: preferences.currency || 'INR',
        preferred_language: preferences.language || 'English'
      }).select().single();
      if (result.error) throw result.error;
      return result.data;
    },
    async listSavedPlaces() {
      if (!configured) return [];
      const result = await client.from('saved_destinations').select('name, created_at').order('created_at', { ascending: false });
      if (result.error) throw result.error;
      return (result.data || []).map((place) => ({ name: place.name, savedAt: place.created_at }));
    },
    async toggleSavedPlace(name) {
      if (!configured) throw new Error('Connect Supabase before saving destinations.');
      const lookup = await client.from('saved_destinations').select('id').eq('name', name).maybeSingle();
      if (lookup.error) throw lookup.error;
      if (lookup.data) {
        const deleted = await client.from('saved_destinations').delete().eq('id', lookup.data.id);
        if (deleted.error) throw deleted.error;
      } else {
        const inserted = await client.from('saved_destinations').insert({ name });
        if (inserted.error) throw inserted.error;
      }
      return this.listSavedPlaces();
    },
    async removeSavedPlace(name) {
      if (!configured) throw new Error('Connect Supabase before saving destinations.');
      const result = await client.from('saved_destinations').delete().eq('name', name);
      if (result.error) throw result.error;
      return this.listSavedPlaces();
    }
  };

  window.tsBackend.ready = ready.then(async (state) => {
    if (!state.session) return state;
    try {
      const [profile, places] = await Promise.all([
        window.tsBackend.loadProfile(),
        window.tsBackend.listSavedPlaces()
      ]);
      if (profile) {
        localStorage.setItem(`ts_user_${state.session.id}_profile`, JSON.stringify({
          first: profile.first_name || state.session.name,
          last: profile.last_name || '',
          email: profile.email || state.session.email,
          phone: profile.phone || ''
        }));
        localStorage.setItem(`ts_user_${state.session.id}_preferences`, JSON.stringify({
          currency: profile.preferred_currency || 'INR',
          language: profile.preferred_language || 'English'
        }));
      }
      localStorage.setItem(`ts_user_${state.session.id}_saved_places`, JSON.stringify(places));
    } catch (error) {
      console.error('Could not sync your TravelSphere data:', error.message);
    }
    return state;
  });
})();
