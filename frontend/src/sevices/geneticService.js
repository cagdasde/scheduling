import axios from "axios";

// Backend'deki app.use('/api/genetic', ...) tanımına tam uyumlu URL
const API_URL = "https://scheduling-gist.onrender.com/api/genetic";

export default {
  // 1. Ders Programı Oluşturma (GA Tetikleme)
  // URL: https://scheduling-gist.onrender.com/api/genetic/generateSchedule
  generateSchedule() {
    return axios.get(`${API_URL}/generateSchedule`);
  },

  // 2. Mevcut Programı Getirme (Eğer veritabanında saklıyorsan)
  // URL: https://scheduling-gist.onrender.com/api/genetic
  getAll() {
    return axios.get(API_URL);
  },

  // 3. Silme (ID ile)
  // URL: https://scheduling-gist.onrender.com/api/genetic/:id
  delete(id) {
    return axios.delete(`${API_URL}/${id}`);
  }
};