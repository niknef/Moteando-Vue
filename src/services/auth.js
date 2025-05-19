import supabase from "./supabase";

/**
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise}
 */
export async function register(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email, 
        password,
    });

    if(error) {
        console.error('[auth.js register] Error al registrarse: ', error);
        throw error;
    }

    return data.user;
}

/**
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise}
 */
export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if(error) {
        console.error('[auth.js login] Error al iniciar sesión: ', error);
        throw error;
    }
    return data.user;
}