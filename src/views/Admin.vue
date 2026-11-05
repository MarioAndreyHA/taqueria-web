<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_URL = 'https://taqueria-backend.onrender.com' 
const activeTab = ref('productos') 

const isSaving = ref(false)
const toast = ref({ show: false, message: '', type: 'success' })
const confirmModal = ref({ show: false, title: '', message: '', action: null })

// NUEVO: Estado para seguridad
const securityForm = ref({ currentPassword: '', newPassword: '' })

const showToast = (message, type = 'success') => { toast.value = { show: true, message, type }; setTimeout(() => toast.value.show = false, 3000) }
const confirmAction = (title, message, action) => { confirmModal.value = { show: true, title, message, action } }
const executeConfirm = async () => { if (confirmModal.value.action) await confirmModal.value.action(); confirmModal.value.show = false }

// Función centralizada para headers (Inyecta el Token en cada petición)
const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('auth_token')
  const headers = { 'Authorization': `Bearer ${token}` }
  if (!isFormData) headers['Content-Type'] = 'application/json'
  return headers
}

// Expulsar si el token expiró o es falso
const handleAuthError = (res) => {
  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    router.push('/login')
    throw new Error('Sesión expirada')
  }
}

const productos = ref([])
const categorias = ref([])
const config = ref({ navbarTitle: '', coverSubtitle: '', logoPreview: '', logoFile: null, coverPreview: '', coverFile: null, videoFb: '', linkFb: '', linkRappi: '', linkDidi: '' })

const loadData = async () => {
  const res = await fetch(`${API_URL}/public-data`) // Esta sí es pública
  const data = await res.json()
  categorias.value = data.categorias
  productos.value = data.productos
  if (data.config) config.value = { ...data.config, logoPreview: data.config.logo, coverPreview: data.config.cover, logoFile: null, coverFile: null }
}
onMounted(() => loadData())

// --- PRODUCTOS ---
const showProductForm = ref(false)
const currentProduct = ref({ id: null, name: '', description: '', price: '', category_id: '', imagePreview: '', file: null })

const openProductForm = (producto = null) => {
  if (producto) currentProduct.value = { ...producto, category_id: producto.category_id || '', imagePreview: producto.image, file: null }
  else currentProduct.value = { id: null, name: '', description: '', price: '', category_id: '', imagePreview: '', file: null }
  showProductForm.value = true
}
const closeProductForm = () => showProductForm.value = false
const handleProductImage = (e) => { const file = e.target.files[0]; if (file) { currentProduct.value.file = file; currentProduct.value.imagePreview = URL.createObjectURL(file) } }

const saveProduct = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const formData = new FormData()
    formData.append('name', currentProduct.value.name)
    formData.append('price', currentProduct.value.price)
    formData.append('description', currentProduct.value.description)
    formData.append('category_id', currentProduct.value.category_id || 'null')
    if (currentProduct.value.file) formData.append('image', currentProduct.value.file)

    const url = currentProduct.value.id ? `${API_URL}/productos/${currentProduct.value.id}` : `${API_URL}/productos`
    const res = await fetch(url, { method: currentProduct.value.id ? 'PUT' : 'POST', headers: getHeaders(true), body: formData })
    handleAuthError(res)
    await loadData()
    closeProductForm()
    showToast('Producto guardado')
  } catch (err) { if(err.message !== 'Sesión expirada') showToast('Error', 'error') } finally { isSaving.value = false }
}

const deleteProduct = (id) => {
  confirmAction("Eliminar Producto", "¿Seguro que deseas eliminarlo?", async () => {
    const res = await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE', headers: getHeaders() })
    handleAuthError(res)
    await loadData(); showToast('Eliminado')
  })
}

// --- CATEGORÍAS ---
const showCategoryForm = ref(false)
const currentCategory = ref({ id: null, name: '', order: 1 })

const openCategoryForm = (categoria = null) => {
  if(categoria) currentCategory.value = { ...categoria }
  else currentCategory.value = { id: null, name: '', order: categorias.value.length + 1 }
  showCategoryForm.value = true
}
const closeCategoryForm = () => showCategoryForm.value = false

const saveCategory = async () => {
  if (isSaving.value) return; isSaving.value = true
  try {
    const url = currentCategory.value.id ? `${API_URL}/categorias/${currentCategory.value.id}` : `${API_URL}/categorias`
    const res = await fetch(url, { method: currentCategory.value.id ? 'PUT' : 'POST', headers: getHeaders(), body: JSON.stringify(currentCategory.value) })
    handleAuthError(res)
    await loadData(); closeCategoryForm(); showToast('Categoría guardada')
  } catch (err) { if(err.message !== 'Sesión expirada') showToast('Error', 'error') } finally { isSaving.value = false }
}

const deleteCategory = (id) => {
  confirmAction("Eliminar Categoría", "¿Borrar categoría?", async () => {
    const res = await fetch(`${API_URL}/categorias/${id}`, { method: 'DELETE', headers: getHeaders() })
    handleAuthError(res)
    await loadData(); showToast('Eliminada')
  })
}

// --- CONFIGURACIÓN ---
const handleConfigImage = (e, type) => { const file = e.target.files[0]; if (file) { config.value[`${type}File`] = file; config.value[`${type}Preview`] = URL.createObjectURL(file) } }

const saveConfig = async () => {
  if (isSaving.value) return; isSaving.value = true
  try {
    const formData = new FormData()
    formData.append('navbarTitle', config.value.navbarTitle || '')
    formData.append('coverSubtitle', config.value.coverSubtitle || '')
    formData.append('videoFb', config.value.videoFb || '')
    formData.append('linkFb', config.value.linkFb || '')
    formData.append('linkRappi', config.value.linkRappi || '')
    formData.append('linkDidi', config.value.linkDidi || '')
    if (config.value.logoFile) formData.append('logo', config.value.logoFile)
    if (config.value.coverFile) formData.append('cover', config.value.coverFile)

    const res = await fetch(`${API_URL}/configuracion`, { method: 'PUT', headers: getHeaders(true), body: formData })
    handleAuthError(res)
    await loadData(); showToast('Configuración actualizada')
  } catch (err) { if(err.message !== 'Sesión expirada') showToast('Error', 'error') } finally { isSaving.value = false }
}

// --- CAMBIAR CONTRASEÑA ---
const changePassword = async () => {
  if (isSaving.value || !securityForm.value.currentPassword || !securityForm.value.newPassword) return
  isSaving.value = true
  try {
    const res = await fetch(`${API_URL}/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(securityForm.value)
    })
    
    if (res.ok) {
      showToast('Contraseña cambiada. Inicia sesión de nuevo.')
      setTimeout(() => { localStorage.removeItem('auth_token'); router.push('/login') }, 2000)
    } else {
      showToast('La contraseña actual es incorrecta', 'error')
    }
  } catch (err) {
    showToast('Error al cambiar contraseña', 'error')
  } finally {
    isSaving.value = false
    securityForm.value = { currentPassword: '', newPassword: '' }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col relative">
    
    <!-- Notificaciones y Modales (iguales) -->
    <div v-if="toast.show" :class="['fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl text-white font-bold z-[100] transition-all animate-fade-in', toast.type === 'success' ? 'bg-green-500' : 'bg-red-500']">{{ toast.message }}</div>
    <div v-if="confirmModal.show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 animate-fade-in"><div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"><h3 class="text-xl font-bold mb-2">{{ confirmModal.title }}</h3><p class="text-gray-600 mb-6">{{ confirmModal.message }}</p><div class="flex justify-end gap-3"><button @click="confirmModal.show = false" class="px-4 py-2 hover:bg-gray-100 rounded-lg">Cancelar</button><button @click="executeConfirm" class="px-4 py-2 bg-red-600 text-white font-bold rounded-lg shadow">Sí, eliminar</button></div></div></div>

    <!-- Header del Panel -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="flex justify-between items-center py-4 border-b border-gray-100">
          <h2 class="text-xl font-black text-brand-dark">Panel de Control</h2>
          <div class="flex gap-2">
            <router-link to="/" class="px-4 py-2 border-2 border-brand-light text-brand-light font-bold rounded-lg hover:bg-brand-light hover:text-white transition-colors text-sm">Ver Tienda</router-link>
            <button @click="() => { localStorage.removeItem('auth_token'); router.push('/login') }" class="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors text-sm">Salir</button>
          </div>
        </div>
        <nav class="flex space-x-2 overflow-x-auto py-3 scrollbar-hide">
          <button @click="activeTab = 'productos'" :class="['px-5 py-2 rounded-lg font-medium whitespace-nowrap', activeTab === 'productos' ? 'bg-brand-light text-white shadow' : 'text-gray-600 hover:bg-gray-100']">🌮 Productos</button>
          <button @click="activeTab = 'categorias'" :class="['px-5 py-2 rounded-lg font-medium whitespace-nowrap', activeTab === 'categorias' ? 'bg-brand-light text-white shadow' : 'text-gray-600 hover:bg-gray-100']">📁 Categorías</button>
          <button @click="activeTab = 'configuracion'" :class="['px-5 py-2 rounded-lg font-medium whitespace-nowrap', activeTab === 'configuracion' ? 'bg-brand-light text-white shadow' : 'text-gray-600 hover:bg-gray-100']">⚙️ Configuración</button>
          <button @click="activeTab = 'seguridad'" :class="['px-5 py-2 rounded-lg font-medium whitespace-nowrap', activeTab === 'seguridad' ? 'bg-brand-light text-white shadow' : 'text-gray-600 hover:bg-gray-100']">🔒 Seguridad</button>
        </nav>
      </div>
    </header>

    <main class="flex-1 p-4 sm:p-6 w-full max-w-7xl mx-auto">
      
      <!-- ================= PRODUCTOS ================= -->
      <div v-if="activeTab === 'productos'" class="animate-fade-in">
        <div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Gestión de Productos</h1><button v-if="!showProductForm" @click="openProductForm()" class="bg-brand-light text-white px-4 py-2 rounded-lg font-bold shadow">+ Nuevo</button></div>
        <div v-if="showProductForm" class="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium mb-1">Nombre</label><input type="text" v-model="currentProduct.name" class="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none"></div>
            <div><label class="block text-sm font-medium mb-1">Precio ($)</label><input type="number" v-model="currentProduct.price" class="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none"></div>
            <div><label class="block text-sm font-medium mb-1">Categoría</label><select v-model="currentProduct.category_id" class="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none"><option value="">Selecciona</option><option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.name }}</option></select></div>
            <div class="md:col-span-2"><label class="block text-sm font-medium mb-1">Descripción</label><textarea v-model="currentProduct.description" rows="2" class="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none"></textarea></div>
            <div class="md:col-span-2"><label class="block text-sm font-medium mb-1">Fotografía</label><div class="flex items-center gap-4"><div v-if="currentProduct.imagePreview" class="w-20 h-20 rounded-lg border overflow-hidden shrink-0"><img :src="currentProduct.imagePreview" class="w-full h-full object-cover"></div><input type="file" accept="image/*" @change="handleProductImage" class="w-full text-sm"></div></div>
          </div>
          <div class="mt-6 flex justify-end gap-3"><button @click="closeProductForm" :disabled="isSaving" class="px-4 py-2 border rounded-lg font-medium">Cancelar</button><button @click="saveProduct" :disabled="isSaving" class="px-4 py-2 bg-brand-light text-white rounded-lg font-semibold shadow">Guardar</button></div>
        </div>
        <div v-if="!showProductForm" class="bg-white rounded-xl shadow-sm border overflow-hidden"><table class="w-full text-center border-collapse"><thead><tr class="bg-gray-100 border-b text-sm"><th class="p-4 font-bold">Foto</th><th class="p-4 font-bold">Nombre</th><th class="p-4 font-bold">Precio</th><th class="p-4 font-bold">Acciones</th></tr></thead><tbody><tr v-for="producto in productos" :key="producto.id" class="border-b"><td class="p-4 flex justify-center"><img v-if="producto.image" :src="producto.image" class="w-12 h-12 rounded-lg object-cover bg-gray-200" /><div v-else class="w-12 h-12 rounded-lg bg-gray-200"></div></td><td class="p-4">{{ producto.name }}</td><td class="p-4 font-extrabold">${{ producto.price }}</td><td class="p-4"><button @click="openProductForm(producto)" class="mr-2 text-blue-600 border rounded px-3 py-1">Editar</button><button @click="deleteProduct(producto.id)" class="text-red-600 border rounded px-3 py-1">Eliminar</button></td></tr></tbody></table></div>
      </div>

      <!-- ================= CATEGORÍAS ================= -->
      <div v-if="activeTab === 'categorias'" class="animate-fade-in">
        <div class="flex justify-between items-center mb-6"><h1 class="text-2xl font-bold">Categorías</h1><button v-if="!showCategoryForm" @click="openCategoryForm()" class="bg-brand-light text-white px-4 py-2 rounded-lg font-bold shadow">+ Nueva</button></div>
        <div v-if="showCategoryForm" class="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block text-sm font-medium mb-1">Nombre</label><input type="text" v-model="currentCategory.name" class="w-full px-3 py-2 border rounded-lg outline-none"></div><div><label class="block text-sm font-medium mb-1">Orden</label><input type="number" v-model="currentCategory.order" class="w-24 px-3 py-2 border rounded-lg outline-none"></div></div>
          <div class="mt-4 flex justify-end gap-3"><button @click="closeCategoryForm" class="px-4 py-2 border rounded-lg">Cancelar</button><button @click="saveCategory" :disabled="isSaving" class="px-4 py-2 bg-brand-light text-white rounded-lg shadow">Guardar</button></div>
        </div>
        <div v-if="!showCategoryForm" class="bg-white rounded-xl shadow-sm border overflow-hidden"><table class="w-full text-center border-collapse"><thead><tr class="bg-gray-100 border-b text-sm"><th class="p-4 font-bold">Orden</th><th class="p-4 font-bold">Nombre</th><th class="p-4 font-bold">Acciones</th></tr></thead><tbody><tr v-for="categoria in categorias" :key="categoria.id" class="border-b"><td>{{ categoria.order }}</td><td>{{ categoria.name }}</td><td class="p-4"><button @click="openCategoryForm(categoria)" class="mr-2 text-blue-600 border rounded px-3 py-1">Editar</button><button @click="deleteCategory(categoria.id)" class="text-red-600 border rounded px-3 py-1">Eliminar</button></td></tr></tbody></table></div>
      </div>

      <!-- ================= CONFIGURACIÓN ================= -->
      <div v-if="activeTab === 'configuracion'" class="animate-fade-in max-w-4xl mx-auto">
        <h1 class="text-2xl font-bold mb-6">Configuración Global</h1>
        <div class="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6"><div><label class="block text-sm mb-1">Nombre Negocio</label><input type="text" v-model="config.navbarTitle" class="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none"></div><div class="md:col-span-2"><label class="block text-sm mb-1">Subtítulo</label><textarea v-model="config.coverSubtitle" rows="2" class="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none"></textarea></div></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6"><div><label class="block text-sm mb-1">Logotipo</label><div class="flex items-center gap-4"><div v-if="config.logoPreview" class="w-16 h-16 rounded-full border overflow-hidden shrink-0"><img :src="config.logoPreview" class="w-full h-full object-cover"></div><input type="file" @change="e => handleConfigImage(e, 'logo')" class="w-full text-sm"></div></div><div><label class="block text-sm mb-1">Portada</label><div class="flex items-center gap-4"><div v-if="config.coverPreview" class="w-24 h-16 rounded-lg border overflow-hidden shrink-0"><img :src="config.coverPreview" class="w-full h-full object-cover"></div><input type="file" @change="e => handleConfigImage(e, 'cover')" class="w-full text-sm"></div></div></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="md:col-span-2"><label class="block text-sm mb-1">Video Facebook (Iframe)</label><input type="text" v-model="config.videoFb" class="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none"></div><div><label class="block text-sm mb-1">Página FB</label><input type="text" v-model="config.linkFb" class="w-full px-3 py-2 border rounded-lg bg-gray-50"></div><div><label class="block text-sm mb-1">Enlace Rappi</label><input type="text" v-model="config.linkRappi" class="w-full px-3 py-2 border rounded-lg bg-gray-50"></div><div><label class="block text-sm mb-1">Enlace DiDi</label><input type="text" v-model="config.linkDidi" class="w-full px-3 py-2 border rounded-lg bg-gray-50"></div></div>
          <div class="pt-4 flex justify-end"><button @click="saveConfig" :disabled="isSaving" class="px-6 py-3 bg-brand-light text-white rounded-lg font-bold shadow-md">Guardar</button></div>
        </div>
      </div>

      <!-- ================= SEGURIDAD ================= -->
      <div v-if="activeTab === 'seguridad'" class="animate-fade-in max-w-md mx-auto">
        <h1 class="text-2xl font-bold mb-6">Cambiar Contraseña</h1>
        <div class="bg-white rounded-xl shadow-sm border p-6">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Contraseña Actual</label>
            <input type="password" v-model="securityForm.currentPassword" class="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none focus:border-brand-light">
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium mb-1">Nueva Contraseña</label>
            <input type="password" v-model="securityForm.newPassword" class="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none focus:border-brand-light">
          </div>
          <button @click="changePassword" :disabled="isSaving || !securityForm.currentPassword || !securityForm.newPassword" class="w-full py-3 bg-brand-dark text-white rounded-lg font-bold shadow-md disabled:opacity-50">Actualizar Contraseña</button>
        </div>
      </div>

    </main>
  </div>
</template>