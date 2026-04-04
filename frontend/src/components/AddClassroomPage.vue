<template>
  <div class="page-wrapper">
    <div class="form-container">
      <h2>Yeni Sınıf Ekle</h2>
      // Sınıf ekleme formu
      <form @submit.prevent="addRoom" class="form">
        <div class="form-group">
          <label for="name">Sınıf Adı</label>
          <input
            id="name"
            v-model="name"
            required
            placeholder="Örneğin: A101"
            type="text"
          />
        </div>

        <div class="form-group">
          <label for="capacity">Kapasite</label>
          <input
            id="capacity"
            v-model.number="capacity"
            required
            placeholder="Örneğin: 30"
            type="number"
            min="1"
          />
        </div>

        <div class="form-group">
          <label class="equipment-label">Ekipmanlar</label>
          <div class="checkbox-group" v-for="equip in equipmentOptions" :key="equip">
            <input
              type="checkbox"
              :id="equip"
              :value="equip"
              v-model="selectedEquipment"
            />
            <label :for="equip">{{ equip }}</label>
          </div>
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? "Kaydediliyor..." : "Kaydet" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      name: "",
      capacity: null,
      selectedEquipment: [],
      loading: false,
      equipmentOptions: [
        "Projeksiyon",
        "Bilgisayar",
        "Beyaz Tahta",
        "Ses Sistemi",
        "Klima",
      ],
    };
  },
  methods: {
    async addRoom() {
      if (this.loading) return;
      this.loading = true;
      try {
        const res = await fetch("http://localhost:3000/api/classrooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: this.name,
            capacity: this.capacity,
            equipment: this.selectedEquipment,
          }),
        });
        if (!res.ok) throw new Error("Sınıf ekleme hatası");
        this.$router.push("/classrooms");
      } catch (e) {
        alert(e.message);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 1rem;
}

.form-container {
  background: white;
  padding: 2.5rem 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  width: 100%;
  color: #333;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-align: center;
}

h2 {
  margin-bottom: 2rem;
  font-weight: 700;
  font-size: 1.8rem;
  color: #4a4a4a;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: left;
}

.form-group {
  width: 100%;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

/* Inputlar */
input[type="text"],
input[type="number"] {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 2px solid #ccc;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  outline: none;
}

input[type="text"]:focus,
input[type="number"]:focus {
  border-color: #667eea;
  box-shadow: 0 0 8px rgba(102, 126, 234, 0.5);
}

/* Checkbox alanı */
.checkbox-group {
  display: flex;
  align-items: center;
  margin-bottom: 0.7rem;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  color: #444;
  padding-left: 0;
  position: relative;
}

/* Gizli gerçek checkbox */
.checkbox-group input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

/* Label'a özel kutu eklemek için */
.checkbox-group label {
  cursor: pointer;
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 30px; /* kutu için boşluk */
}

/* Checkbox kutusu */
.checkbox-group label::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 22px;
  width: 22px;
  border: 2px solid #667eea;
  border-radius: 6px;
  background-color: white;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  box-sizing: border-box;
}

/* İşaret görünür */
.checkbox-group input[type="checkbox"]:checked + label::before {
  background-color: #667eea;
  border-color: #667eea;
}

/* İşaret simgesi */
.checkbox-group input[type="checkbox"]:checked + label::after {
  content: "✓";
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  color: white;
  font-size: 16px;
  font-weight: bold;
}

/* Buton stili */
button {
  background-color: #667eea;
  color: white;
  font-weight: 700;
  padding: 0.9rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%;
}

button:hover:not(:disabled) {
  background-color: #5563c1;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
