<template>
  <div class="page-container">
    <div class="content-box">
      <h1 class="page-title">📚 Dersler</h1>

      <ul v-if="courses.length" class="list">
        <li v-for="course in courses" :key="course.id" class="list-item">
          <template v-if="editingCourse?.id === course.id">
            <input v-model="editingCourse.course_code" class="input-code" />
            <input v-model="editingCourse.course_name" class="input-name" />
            <input v-model="editingCourse.instructor" class="input-instructor" />
            <button @click="saveEdit" class="btn save">💾</button>
            <button @click="cancelEdit" class="btn cancel">✖️</button>
          </template>

          <template v-else>
            <div class="course-info">
              <strong>{{ course.course_code }}</strong>: {{ course.course_name }} – {{ course.instructor_id }}
            </div>
            <div class="actions">
              <button @click="startEdit(course)" class="btn edit">✏️</button>
              <button @click="deleteCourse(course.id)" class="btn delete">🗑️</button>
            </div>
          </template>
        </li>
      </ul>

      <p v-else class="empty-text">Henüz ders eklenmemiş.</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      courses: [],
      editingCourse: null,
    };
  },
  async mounted() {
    await this.fetchCourses();
  },
  methods: {
    async fetchCourses() {
      const res = await fetch("https://scheduling-gist.onrender.com/api/courses");
      this.courses = await res.json();
      console.log(this.courses);
    },
    async deleteCourse(id) {
      if (!confirm("Bu dersi silmek istediğinize emin misiniz?")) return;
      await fetch(`https://scheduling-gist.onrender.com/api/courses/${id}`, { method: "DELETE" });
      this.fetchCourses();
    },
    startEdit(course) {
      this.editingCourse = { ...course };
    },
    cancelEdit() {
      this.editingCourse = null;
    },
    async saveEdit() {
      const { id, code, name, instructor } = this.editingCourse;
      await fetch(`https://scheduling-gist.onrender.com/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, instructor }),
      });
      this.editingCourse = null;
      this.fetchCourses();
    },
  },
};
</script>

<style scoped>
.page-container {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #f0f4ff, #d9e2ff);
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.content-box {
  background: #fff;
  padding: 2.5rem 3rem;
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.page-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e0e6f2;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 3px 6px rgba(0,0,0,0.05);
  transition: background 0.2s;
}

.list-item:hover {
  background: #e6f0ff;
}

.course-info {
  font-size: 1.1rem;
  color: #34495e;
  flex: 1;
}

.actions {
  display: flex;
  gap: 1rem;
}

.input-code,
.input-name,
.input-instructor {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  margin-right: 10px;
  width: auto;
}

.input-code {
  width: 80px;
}

.input-name {
  flex-grow: 1;
}

.input-instructor {
  width: 150px;
}

.btn {
  cursor: pointer;
  border: none;
  background: transparent;
  font-size: 1.3rem;
  transition: transform 0.2s, color 0.2s;
}

.btn:hover {
  transform: scale(1.15);
}

.btn.edit {
  color: #3498db;
}

.btn.delete {
  color: #e74c3c;
}

.btn.save {
  color: #27ae60;
}

.btn.cancel {
  color: #7f8c8d;
}

.empty-text {
  text-align: center;
  margin-top: 3rem;
  color: #95a5a6;
  font-size: 1.2rem;
}
</style>
