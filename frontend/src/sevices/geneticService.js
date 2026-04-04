import axios from "axios";

const API_URL = "http://localhost:3000/api/genetics";

export default {
  getAll() {
    return axios.get(API_URL);
  },
  add(genetic) {
    return axios.post(API_URL, genetic);
  },
  update(id, genetic) {
    return axios.put(`${API_URL}/${id}`, genetic);
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
