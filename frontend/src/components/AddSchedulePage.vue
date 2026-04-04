<template>
    <div class="container mx-auto">
      <h1 class="text-3xl font-semibold mb-4">Yeni Planlama Ekle</h1>
      <form @submit.prevent="addSchedule">
        <div class="mb-4">
          <label for="course_id" class="block text-gray-700">Ders Seçin</label>
          <select v-model="newSchedule.course_id" id="course_id" class="mt-2 block w-full p-2 border rounded">
            <option v-for="course in courses" :key="course.id" :value="course.id">{{ course.name }}</option>
          </select>
        </div>
  
        <div class="mb-4">
          <label for="classroom_id" class="block text-gray-700">Sınıf Seçin</label>
          <select v-model="newSchedule.classroom_id" id="classroom_id" class="mt-2 block w-full p-2 border rounded">
            <option v-for="classroom in classrooms" :key="classroom.id" :value="classroom.id">{{ classroom.name }}</option>
          </select>
        </div>
  
        <div class="mb-4">
          <label for="day_of_week" class="block text-gray-700">Gün</label>
          <input type="text" v-model="newSchedule.day_of_week" id="day_of_week" class="mt-2 block w-full p-2 border rounded" />
        </div>
  
        <div class="mb-4">
          <label for="start_time" class="block text-gray-700">Başlangıç Saati</label>
          <input type="time" v-model="newSchedule.start_time" id="start_time" class="mt-2 block w-full p-2 border rounded" />
        </div>
  
        <div class="mb-4">
          <label for="end_time" class="block text-gray-700">Bitiş Saati</label>
          <input type="time" v-model="newSchedule.end_time" id="end_time" class="mt-2 block w-full p-2 border rounded" />
        </div>
  
        <button type="submit" class="bg-blue-500 text-white py-2 px-4 rounded">Ekle</button>
      </form>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        newSchedule: {
          course_id: '',
          classroom_id: '',
          day_of_week: '',
          start_time: '',
          end_time: ''
        },
        courses: [],
        classrooms: []
      };
    },
    mounted() {
      this.fetchCourses();
      this.fetchClassrooms();
    },
    methods: {
      async fetchCourses() {
        try {
          const response = await axios.get('http://localhost:3000/api/courses');
          this.courses = response.data;
        } catch (error) {
          console.error('Dersler alınırken hata:', error);
        }
      },
      async fetchClassrooms() {
        try {
          const response = await axios.get('http://localhost:3000/api/classrooms');
          this.classrooms = response.data;
        } catch (error) {
          console.error('Sınıflar alınırken hata:', error);
        }
      },
      async addSchedule() {
        try {
          await axios.post('http://localhost:3000/api/schedules', this.newSchedule);
          this.$router.push('/schedules'); // Planlama başarıyla eklendikten sonra listeye dön
        } catch (error) {
          console.error('Planlama eklenirken hata:', error);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  form {
    max-width: 600px;
    margin: 0 auto;
  }
  </style>
  