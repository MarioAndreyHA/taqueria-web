<script setup>
import { ref, onMounted, computed } from 'vue'

const API_URL = 'https://taqueria-backend.onrender.com'
const categorias = ref([])
const menuItems = ref([])
const config = ref({})
const categoriaActiva = ref('Todos')

const fetchPublicData = async () => {
  try {
    const res = await fetch(`${API_URL}/public-data`)
    const data = await res.json()
    categorias.value = data.categorias
    menuItems.value = data.productos
    config.value = data.config || {}
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => fetchPublicData())

const productosFiltrados = computed(() => {
  if (categoriaActiva.value === 'Todos') return menuItems.value
  const catObj = categorias.value.find(c => c.name === categoriaActiva.value)
  if (!catObj) return menuItems.value
  return menuItems.value.filter(item => item.category_id === catObj.id)
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-24">
    <!-- Navbar Global Movido Aquí -->
    <nav class="p-4 bg-white shadow flex justify-between items-center fixed top-0 w-full z-50">
      <span class="font-bold text-xl text-brand-dark">{{ config.navbarTitle || 'Taquería' }}</span>
    </nav>

    <!-- Agregamos pt-16 por la barra fija -->
    <div class="pt-16 animate-fade-in">
      <header class="relative h-64 sm:h-80 bg-cover bg-center" :style="{ backgroundImage: `url(${config.cover || 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1000'})` }">
        <div class="absolute inset-0 bg-black bg-opacity-60"></div>
        <div class="relative z-10 h-full flex flex-col justify-center items-center text-center p-4">
          <img v-if="config.logo" :src="config.logo" alt="Logo" class="w-32 h-32 object-contain mb-2 drop-shadow-lg" />
          <h1 v-else class="text-4xl font-extrabold text-white mb-2 drop-shadow-md">{{ config.navbarTitle || 'El Auténtico Sabor' }}</h1>
          <p class="text-gray-200 text-sm sm:text-base">{{ config.coverSubtitle || 'Los mejores tacos de la ciudad, directo a tu mesa.' }}</p>
        </div>
      </header>

      <section v-if="config.videoFb" class="mt-6 px-4 max-w-2xl mx-auto">
        <div class="bg-white rounded-2xl shadow-sm border p-4 text-center">
          <h2 class="text-lg font-bold mb-3 text-gray-800">Conoce más de nosotros</h2>
          <div class="aspect-video bg-gray-200 rounded-xl mb-3 flex items-center justify-center overflow-hidden" v-html="config.videoFb"></div>
          <a v-if="config.linkFb" :href="config.linkFb" target="_blank" class="inline-flex items-center gap-2 text-blue-600 font-semibold hover:underline text-sm">Ver en Facebook</a>
        </div>
      </section>

      <section class="mt-6 px-4">
        <h2 class="text-xl font-bold mb-4 text-gray-800">Nuestro Menú</h2>
        <div class="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
          <button @click="categoriaActiva = 'Todos'" :class="['whitespace-nowrap px-5 py-2 rounded-full font-semibold shadow-md transition-colors', categoriaActiva === 'Todos' ? 'bg-brand-light text-white' : 'bg-white text-gray-700 border']">Todos</button>
          <button v-for="cat in categorias" :key="cat.id" @click="categoriaActiva = cat.name" :class="['whitespace-nowrap px-5 py-2 rounded-full font-semibold shadow-md transition-colors', categoriaActiva === cat.name ? 'bg-brand-light text-white' : 'bg-white text-gray-700 border']">{{ cat.name }}</button>
        </div>
      </section>

      <section class="mt-6 px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-if="productosFiltrados.length === 0" class="col-span-full text-center text-gray-500 py-8">Aún no hay productos en esta categoría.</div>
        <div v-for="item in productosFiltrados" :key="item.id" class="flex bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div class="w-1/3 sm:w-40 flex-shrink-0"><img v-if="item.image" :src="item.image" class="w-full h-full object-cover" /><div v-else class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Sin foto</div></div>
          <div class="p-3 flex flex-col justify-between flex-1">
            <div><h3 class="text-base font-bold text-gray-900">{{ item.name }}</h3><p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ item.description }}</p></div>
            <div class="mt-2 text-brand-light font-extrabold text-lg">${{ item.price }}</div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="config.linkRappi || config.linkDidi" class="fixed bottom-4 left-0 right-0 px-4 flex justify-center gap-3 z-50">
      <a v-if="config.linkRappi" :href="config.linkRappi" target="_blank" class="flex-1 max-w-[180px] bg-[#FF441F] text-white text-center font-bold py-3 px-2 rounded-2xl shadow-lg flex items-center justify-center">Pide en Rappi</a>
      <a v-if="config.linkDidi" :href="config.linkDidi" target="_blank" class="flex-1 max-w-[180px] bg-[#FF7D00] text-white text-center font-bold py-3 px-2 rounded-2xl shadow-lg flex items-center justify-center">Pide en DiDi</a>
    </div>
  </div>
</template>