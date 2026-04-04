import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './components/HomePage.vue'
import AdminPanel from './components/AdminPanel.vue'
import CoursesPage from './components/CoursesPage.vue'
import ClassroomsPage from './components/ClassroomsPage.vue'
import TeachersPage from './components/instructors.vue'
import SchedulePage from './components/SchedulePage.vue'
import AddCoursePage from './components/AddCoursePage.vue'
import AddClassroomPage from './components/AddClassroomPage.vue'

const routes = [
  { path: '/', component: HomePage },
  { path: '/admin', component: AdminPanel },
  { path: '/courses', component: CoursesPage },
  { path: '/courses/add', component: AddCoursePage },
  { path: '/classrooms', component: ClassroomsPage },
  { path: '/classrooms/add', component: AddClassroomPage },
  { path: '/teachers', component: TeachersPage },
  { path: '/schedule', component: SchedulePage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
