import supabase from './supabase'

export async function saveRoute ({ name, description, is_public, geojson }) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return   // ↩️  todavía no logeado: salteamos guardado

  const { error } = await supabase.from('routes').insert({
    user_id: user.id,
    name,
    description,
    is_public,
    data: geojson
  })
  if (error) throw error
}
