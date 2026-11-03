<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const password = ref('')
const error = ref(false)

const handleLogin = () => {
  if (password.value === 'admin2026') {
    localStorage.setItem('auth_token', 'true')
    router.push('/admin')
  } else {
    error.value = true
    setTimeout(() => error.value = false, 3000)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-sm w-full text-center">
      <h1 class="text-2xl font-black text-brand-dark mb-6">Acceso Restringido</h1>
      <input type="password" v-model="password" @keyup.enter="handleLogin" placeholder="Contraseña de administrador" class="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 mb-4 outline-none focus:border-brand-light text-center">
      <p v-if="error" class="text-red-500 text-sm font-bold mb-4">Contraseña incorrecta</p>
      <button @click="handleLogin" class="w-full bg-brand-light hover:bg-brand-dark text-white font-bold py-3 rounded-xl shadow transition-colors">Entrar al Panel</button>
      <router-link to="/" class="block mt-6 text-sm text-gray-500 hover:text-brand-light">Volver a la tienda</router-link>
    </div>
  </div>
</template>