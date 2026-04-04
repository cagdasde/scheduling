<template>
  <div class="page-container">
    <div class="content-box">
      <h1 class="page-title">📚 Sınıf Listesi</h1>

      <div class="add-button-wrapper">
        <router-link to="/classrooms/add" class="add-button">➕ Yeni Sınıf Ekle</router-link>
      </div>

      <div v-if="rooms.length" class="cards-container">
        <div v-for="room in rooms" :key="room.id" class="card">
          <template v-if="editing?.id === room.id">
            <input v-model="editing.name" class="input" placeholder="Sınıf Adı" />
            <input v-model.number="editing.capacity" class="input" type="number" placeholder="Kapasite" />
            
            <!-- Equipment çoklu input için buraya checkboxlar veya string input koyabilirsin -->
            <input v-model="equipmentText" class="input" placeholder="Ekipmanlar (virgülle ayır)" />

            <div class="button-group">
              <button @click="saveEdit" class="action-button save">💾</button>
              <button @click="cancelEdit" class="action-button cancel">✖️</button>
            </div>
          </template>

          <template v-else>
            <h2 class="card-title">{{ room.room_code }}</h2>
            <p class="card-detail">Kapasite: {{ room.capacity }}</p>
            <p class="card-detail">Ekipmanlar: {{ formatEquipment(room.equipment_available) }}</p>
            <div class="button-group">
              <button @click="startEdit(room)" class="action-button edit">✏️</button>
              <button @click="deleteRoom(room.id)" class="action-button delete">🗑️</button>
            </div>
          </template>
        </div>
      </div>

      <p v-else class="empty-text">Henüz sınıf eklenmemiş.</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      rooms: [],
      editing: null,
      equipmentText: "",
    };
  },
  async mounted() {
    await this.fetchRooms();
  },
  methods: {
    async fetchRooms() {
      const res = await fetch("http://localhost:3000/api/classrooms");
      this.rooms = await res.json();
    },
    async deleteRoom(id) {
      if (!confirm("Bu sınıfı silmek istediğinize emin misiniz?")) return;
      await fetch(`http://localhost:3000/api/classrooms/${id}`, { method: "DELETE" });
      this.fetchRooms();
    },
    startEdit(room) {
      this.editing = { ...room };
      this.equipmentText = Array.isArray(room.equipment_available)
        ? room.equipment_available.join(", ")
        : "";
    },
    cancelEdit() {
      this.editing = null;
      this.equipmentText = "";
    },
    async saveEdit() {
      const equipmentArray = this.equipmentText
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const { id, name, capacity } = this.editing;

      await fetch(`http://localhost:3000/api/classrooms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, capacity, equipment_available: equipmentArray }),
      });

      this.editing = null;
      this.equipmentText = "";
      this.fetchRooms();
    },
    formatEquipment(equipment) {
      if (!equipment || equipment.length === 0) return "Belirtilmemiş";
      if (Array.isArray(equipment)) return equipment.join(", ");
      return equipment;
    },
  },
};
</script>

<style scoped>
.page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(to bottom right, #e0f0ff, #f5f7fa);
  padding: 20px;
}

.content-box {
  width: 100%;
  max-width: 1000px;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.page-title {
  text-align: center;
  font-size: 32px;
  color: #1a202c;
  margin-bottom: 30px;
}

.add-button-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.add-button {
  background: #4a90e2;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s;
}

.add-button:hover {
  background: #357ab8;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.card {
  background: #f9f9f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  width: 280px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #2d3748;
}

.card-detail {
  font-size: 14px;
  color: #555;
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.action-button {
  font-size: 18px;
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
}

.action-button:hover {
  transform: scale(1.1);
}

.action-button.edit {
  color: #2b6cb0;
}

.action-button.delete {
  color: #e53e3e;
}

.action-button.save {
  color: #38a169;
}

.action-button.cancel {
  color: #718096;
}

.empty-text {
  text-align: center;
  margin-top: 40px;
  font-size: 16px;
  color: #666;
}
</style>
