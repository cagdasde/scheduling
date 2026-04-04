<template>
  <div>
    <button @click="generateSchedule" :disabled="loading">
      {{ loading ? 'Hesaplanıyor... 🧬' : 'Ders Programını Üret' }}
    </button>

    <div v-if="loading" class="loader">Algoritma çalışıyor, lütfen bekleyin...</div>

    <table v-if="schedule.length > 0 && !loading">
      <thead>
        <tr>
          <th>Saat / Gün</th>
          <th v-for="day in days" :key="day">{{ day }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="time in timeSlots" :key="time">
          <td class="time-col">{{ time }}</td>
          <td v-for="day in days" :key="day">
            <div v-if="getEntry(day, time)" class="course-card">
              <span class="course-name">{{ getEntry(day, time).course }}</span><br />
              <span class="classroom-info">📍 {{ getEntry(day, time).classroom }}</span>
            </div>
            <div v-else class="empty-slot">-</div>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading && hasAttempted" class="error-text">
      Ders programı üretilemedi veya veri bulunamadı.
    </p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      schedule: [],
      loading: false,
      hasAttempted: false, // İlk deneme yapıldı mı?
      days: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'], 
      timeSlots: [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00'
      ],
    };
  },
  methods: {
    async generateSchedule() {
      this.loading = true;
      this.hasAttempted = true;
      try {
        const response = await fetch('https://scheduling-gist.onrender.com/api/genetic/generateSchedule');
        
        if (!response.ok) throw new Error("Sunucu yanıt vermedi");
        
        const data = await response.json();
        this.schedule = data;
      } catch (error) {
        console.error('Ders programı alınırken hata oluştu:', error);
        alert("Program üretilirken bir hata oluştu. Veritabanında yeterli ders/sınıf olduğundan emin olun.");
      } finally {
        this.loading = false;
      }
    },
    getEntry(day, time) {
      // Backend'den gelen objenin yapısına göre burayı teyit etmelisin
      // Örn: { day: 'Pazartesi', time: '09:00', course: 'Matematik', classroom: 'A-101' }
      return this.schedule.find(
        entry => entry.day === day && entry.time === time
      );
    }
  }
};
</script>

<style scoped>
/* Görselliği biraz daha profesyonel hale getirelim */
.course-card {
  background-color: #e3f2fd;
  border-radius: 4px;
  padding: 5px;
  font-size: 0.9rem;
}
.course-name {
  font-weight: bold;
  color: #1976d2;
}
.classroom-info {
  font-size: 0.8rem;
  color: #555;
}
.time-col {
  background-color: #f5f5f5;
  font-weight: bold;
}
.empty-slot {
  color: #ccc;
}
.loader {
  margin: 20px 0;
  color: #666;
  font-style: italic;
}
/* ... senin diğer stillerin ... */
</style>