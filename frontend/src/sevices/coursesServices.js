import axios from "axios";

const API_URL = "https://scheduling-gist.onrender.com/api/courses";

export default {
  getAll() {
    return axios.get(API_URL);
  },
  add(course) {
    return axios.post(API_URL, course);
  },
  update(id, course) {
    return axios.put(`${API_URL}/${id}`, course);
  },
  delete(id) {
    return axios.delete(`${API_URL}/${id}`);
  },
  importExcel(file) {
    const formData = new FormData();
    formData.append("file", file);
    return axios.post(`${API_URL}/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  exportExcel() {
    return axios.get(`${API_URL}/export`, { responseType: "blob" });
  },
};
