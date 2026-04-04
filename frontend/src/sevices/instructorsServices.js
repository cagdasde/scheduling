import axios from "axios";

const API_URL = "http://localhost:3000/api/instructors";

export default {
  getAll() {
    return axios.get(API_URL);
  },
  add(instructor) {
    return axios.post(API_URL, instructor);
  },
  update(id, instructor) {
    return axios.put(`${API_URL}/${id}`, instructor);
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
