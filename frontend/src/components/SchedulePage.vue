<template>
  <div class="schedule-container">

    <!-- Üst Menü -->
    <div class="actions">
      <input type="file" @change="handleFileUpload" />
      <button @click="generateFromExcel">Excel → GA</button>
      <button @click="generateFromDB">DB → GA</button>
      <button @click="exportToExcel">Excel’e Aktar</button>
      <button @click="showConflicts" style="background-color: #4CAF50; color: white;">
        📊 Çatışma Raporu
      </button>
    </div>

    <!-- Çatışma Bilgisi -->
    <div v-if="conflicts" class="conflicts-info" style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
      <h3 style="color: #2c3e50; margin-bottom: 10px;">📈 Performans Sonuçları</h3>
      <p><strong>Başlangıç Çatışmaları:</strong> {{ conflicts.initial?.instructor || 0 }} (Öğretim Üyesi), {{ conflicts.initial?.room || 0 }} (Derslik)</p>
      <p><strong>Bitiş Çatışmaları:</strong> {{ conflicts.final?.instructor || 0 }} (Öğretim Üyesi), {{ conflicts.final?.room || 0 }} (Derslik)</p>
      <p><strong>Azalma Oranı:</strong> {{ conflicts.reduction || 0 }}%</p>
      <p><strong>Fitness Skoru:</strong> {{ fitnessScore || 0 }}</p>
    </div>

    <!-- Çizelge Tablosu -->
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th v-for="day in days" :key="day">{{ day }}</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="time in timeSlots" :key="time">
          <td class="time-col">{{ time }}</td>

          <td v-for="day in days" :key="day">
            <!-- GÜVENLİ FİLTRELEME -->
            <div
              v-for="entry in getEntries(day, time)"
              :key="entry.course + entry.classroom + entry.instructor"
              class="course-card"
              :style="{ backgroundColor: getCourseColor(entry.course) }"
            >
              {{ entry.course || 'Bilinmeyen' }}<br>
              <small>📍 {{ entry.classroom || 'Bilinmeyen' }}</small><br>
              <small>👤 {{ entry.instructor || 'Bilinmeyen' }}</small>
            </div>

            <div v-if="getEntries(day,time).length === 0" class="empty-cell"></div>
          </td>
        </tr>
      </tbody>
    </table>

  </div>
</template>


<script>
import * as XLSX from "xlsx";
import axios from "axios";

export default {
  data(){
    return {
      excelData: [],
      schedule: [],  // SADECE TIMETABLE DİZİSİ BURADA OLACAK
      conflicts: null,
      fitnessScore: 0,

      // GA ile tam eşleşen zaman grid'i
      days:["Monday","Tuesday","Wednesday","Thursday","Friday"],
      timeSlots: [
        "09:00-09:40","10:00-10:40","11:00-11:40",
        "11:40-12:20","12:40-13:20","13:40-14:20",
        "14:40-15:20","15:40-16:20","16:40-17:20"
      ],

      courseColors:{} // otomatik renk atama sistemi
    }
  },

  methods:{
    getEntries(day,time){
      // GÜVENLİ FİLTRELEME
      if (!Array.isArray(this.schedule)) {
        console.warn('Schedule bir dizi değil:', this.schedule);
        return [];
      }
      
      return this.schedule.filter(e => {
        if (!e) return false;
        return e.day === day && e.time === time;
      });
    },

    getCourseColor(course){
      if(!this.courseColors[course]){
        const colors=["#1E88E5","#43A047","#8E24AA","#F4511E","#3949AB","#00897B",
                      "#C2185B","#6D4C41","#7E57C2","#00ACC1"];
        this.courseColors[course]=colors[Object.keys(this.courseColors).length%colors.length];
      }
      return this.courseColors[course];
    },


    /* ============ EXCEL UPLOAD ============ */
    handleFileUpload(e){
      const file=e.target.files[0];
      const reader=new FileReader();

      reader.onload=evt=>{
        const workbook=XLSX.read(evt.target.result,{type:"array"});
        const sheet=workbook.Sheets[workbook.SheetNames[0]];
        this.excelData=XLSX.utils.sheet_to_json(sheet);
      };
      reader.readAsArrayBuffer(file);
    },


    /* ============ EXCEL → GA ============ */
    async generateFromExcel(){
      if(!this.excelData.length) return alert("Önce Excel seç");
      try {
        const res=await axios.post("https://scheduling-gist.onrender.com/api/run-ga",this.excelData);
        // Eski API diziyi direkt dönüyor olabilir
        if (Array.isArray(res.data)) {
          this.schedule = res.data;
          this.conflicts = null;
        } else if (res.data && res.data.timetable) {
          this.schedule = res.data.timetable || [];
          this.conflicts = res.data.conflicts || null;
          this.fitnessScore = res.data.fitnessScore || 0;
        }
      } catch (error) {
        console.error('Excel GA hatası:', error);
        alert('GA çalıştırılırken hata: ' + error.message);
      }
    },

    /* ============ DB → GA ============ */
    async generateFromDB(){
      try {
        console.log("📡 API çağrısı yapılıyor...");
        const res = await axios.get("https://scheduling-gist.onrender.com/api/generateSchedule");
        console.log("📥 API Yanıtı:", res.data);
        
        // ÖNEMLİ: timetable dizisini al, tüm response'u değil!
        if (res.data && res.data.success) {
          if (Array.isArray(res.data.timetable)) {
            this.schedule = res.data.timetable;
            console.log("✅ Schedule dizisi yüklendi:", this.schedule.length, "kayıt");
            
            // Konsola tablo şeklinde göster
            console.table(this.schedule.slice(0, 5)); // İlk 5 kaydı göster
          } else {
            console.error("❌ timetable bir dizi değil:", res.data.timetable);
            this.schedule = [];
          }
          
          this.conflicts = res.data.conflicts || null;
          this.fitnessScore = res.data.fitnessScore || 0;
          
          // Çatışma bilgilerini göster
          if (this.conflicts) {
            console.log("📊 Çatışma Raporu:");
            console.log("- Başlangıç:", this.conflicts.initial);
            console.log("- Bitiş:", this.conflicts.final);
            console.log("- Azalma:", this.conflicts.reduction + "%");
            console.log("- Fitness:", this.fitnessScore);
          }
        } else {
          console.error("❌ API başarısız yanıt:", res.data);
          this.schedule = [];
        }
      } catch (error) {
        console.error("❌ API çağrı hatası:", error);
        alert('Program oluşturulurken hata: ' + error.message);
        this.schedule = [];
      }
    },

    /* ============ EXCEL EXPORT ============ */
    exportToExcel(){
      if (!Array.isArray(this.schedule) || this.schedule.length === 0) {
        alert("Önce program oluşturun!");
        return;
      }
      
      const ws = XLSX.utils.json_to_sheet(this.schedule);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Schedule");
      XLSX.writeFile(wb, "GA_Schedule.xlsx");
    },

    /* ============ ÇATIŞMA RAPORU ============ */
    showConflicts(){
      if (!this.conflicts) {
        alert("Henüz çatışma raporu yok. Önce DB → GA butonuna tıklayın.");
        return;
      }
      
      const initialTotal = (this.conflicts.initial?.instructor || 0) + 
                          (this.conflicts.initial?.room || 0) + 
                          (this.conflicts.initial?.capacity || 0);
      
      const finalTotal = (this.conflicts.final?.instructor || 0) + 
                        (this.conflicts.final?.room || 0) + 
                        (this.conflicts.final?.capacity || 0);
      
      const message = `
📋 PERFORMANS RAPORU
=====================
Başlangıç Çatışmaları:
- Öğretim Üyesi: ${this.conflicts.initial?.instructor || 0}
- Derslik: ${this.conflicts.initial?.room || 0}
- Kapasite: ${this.conflicts.initial?.capacity || 0}
- TOPLAM: ${initialTotal}

Bitiş Çatışmaları:
- Öğretim Üyesi: ${this.conflicts.final?.instructor || 0}
- Derslik: ${this.conflicts.final?.room || 0}
- Kapasite: ${this.conflicts.final?.capacity || 0}
- TOPLAM: ${finalTotal}

📈 Performans:
- Azalma Oranı: ${this.conflicts.reduction || 0}%
- Fitness Skoru: ${this.fitnessScore || 0}
      `;
      
      alert(message);
    }
  }
}
</script>



<style scoped>
.schedule-container{padding:25px;font-family:'Arial';max-width:1250px;margin:auto;}
.actions{display:flex;gap:10px;margin-bottom:20px;justify-content:center;}

table{width:100%;border-collapse:collapse;table-layout:fixed;}
th,td{border:1px solid #333;padding:6px;text-align:center;height:78px;}

thead{background:#0D47A1;color:#fff;font-size:1.12em;}
.time-col{background:#EEE;font-weight:bold;width:110px;}

.course-card{
  color:#fff;padding:5px;border-radius:6px;font-size:.85em;
  font-weight:bold;line-height:15px;white-space:normal;
  margin: 2px 0;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.empty-cell{background:#fff;height:100%;}

.conflicts-info {
  border-left: 4px solid #4CAF50;
  padding-left: 15px;
}

.conflicts-info h3 {
  margin-top: 0;
}

.conflicts-info p {
  margin: 5px 0;
}
</style>