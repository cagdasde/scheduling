<template>
  <div class="page-container">
    <div class="form-box">
      <h2 class="form-title">Yeni Ders Ekle</h2>
      <form @submit.prevent="addCourse" class="form">
        <div class="form-group">
          <label>Ders Adı</label>
          <input v-model="course.name" type="text" required class="input" />
        </div>

        <div class="form-group">
          <label>Ders Kodu</label>
          <input v-model="course.code" type="text" required class="input" />
        </div>

        <div class="form-group">
          <label>Eğitmen</label>
          <input v-model="course.instructor" type="text" required class="input" />
        </div>

        <div class="form-group">
          <label>Haftalık Saat</label>
          <input v-model.number="course.weekly_hours" type="number" required class="input" />
        </div>

        <div class="form-group">
          <label>Gerekli Kapasite</label>
          <input v-model.number="course.required_capacity" type="number" required class="input" />
        </div>

        <div class="form-group">
          <label>Tercih Edilen Günler</label>
          <select v-model="course.preferred_days" multiple class="input select-multiple">
            <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Tercih Edilen Saat Aralıkları</label>
          <select v-model="course.preferred_time_slots" multiple class="input select-multiple">
            <option v-for="slot in timeSlots" :key="slot" :value="slot">{{ slot }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Gerekli Ekipman</label>
          <input
            v-model="course.equipment_needed"
            type="text"
            placeholder="örnek: computer,projector"
            class="input"
          />
        </div>

        <button type="submit" class="btn-submit">Ders Ekle</button>

        <p v-if="message" :class="['message', messageType === 'success' ? 'success' : 'error']">
          {{ message }}
        </p>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      course: {
        name: '',
        code: '',
        instructor: '',
        weekly_hours: null,
        required_capacity: null,
        preferred_days: [],
        preferred_time_slots: [],
        equipment_needed: '',
      },
      message: '',
      messageType: '',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timeSlots: ['08:00-10:00', '10:00-12:00', '13:00-15:00', '15:00-17:00'],
    };
  },
  methods: {
    async addCourse() {
      try {
        const response = await fetch('http://localhost:3000/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.course),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        this.message = 'Ders başarıyla eklendi!';
        this.messageType = 'success';

        this.course = {
          name: '',
          code: '',
          instructor: '',
          weekly_hours: null,
          required_capacity: null,
          preferred_days: [],
          preferred_time_slots: [],
          equipment_needed: '',
        };
      } catch (err) {
        console.error('Ders eklerken hata:', err);
        this.message = err.message;
        this.messageType = 'error';
      }
    },
  },
};
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.form-box {
  background: white;
  padding: 2.5rem 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #1e293b;
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1.4rem;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: #334155;
}

.input {
  width: 100%;
  padding: 0.6rem 0.9rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 5px #2563ebaa;
}

.select-multiple {
  height: 120px;
}

.btn-submit {
  background-color: #2563eb;
  color: white;
  font-weight: 700;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 1rem;
}

.btn-submit:hover {
  background-color: #1d4ed8;
}

.message {
  margin-top: 1.5rem;
  font-weight: 600;
  text-align: center;
  font-size: 1rem;
}

.success {
  color: #16a34a;
}

.error {
  color: #dc2626;
}
</style>
