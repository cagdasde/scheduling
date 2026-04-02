<template>
    <div>
      <button @click="generateSchedule">Ders Programını Üret</button>
  
      <table v-if="schedule.length > 0">
        <thead>
          <tr>
            <th>Saat / Gün</th>
            <th v-for="day in days" :key="day">{{ day }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="time in timeSlots" :key="time">
            <td>{{ time }}</td>
            <td v-for="day in days" :key="day">
              <div v-if="getEntry(day, time)">
                <strong>{{ getEntry(day, time).course }}</strong><br />
                {{ getEntry(day, time).classroom }}
              </div>
              <div v-else>
                -
              </div>
            </td>
          </tr>
        </tbody>
      </table>
  
      
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        schedule: [],
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], // Günler
        timeSlots: [
          '08:00', '09:00', '10:00', '11:00', '12:00',
          '13:00', '14:00', '15:00', '16:00', '17:00'
        ], // Saat dilimleri
      };
    },
    methods: {
      async generateSchedule() {
        try {
          const response = await fetch('https://scheduling-gist.onrender.com/api/genetic/generateSchedule');
          const data = await response.json();
          this.schedule = data;
        } catch (error) {
          console.error('Ders programı alınırken hata oluştu:', error);
        }
      },
      getEntry(day, time) {
        return this.schedule.find(
          entry => entry.day === day && entry.time.startsWith(time)
        );
      }
    }
  };
  </script>
  
  <style scoped>
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  th, td {
    padding: 10px;
    border: 1px solid #ddd;
    text-align: center;
    min-width: 100px;
  }
  
  button {
    padding: 10px;
    margin-bottom: 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #45a049;
  }
  
  strong {
    font-weight: bold;
  }
  </style>
  