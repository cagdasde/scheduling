// ga_stats.js

// 1) BURAYI KENDİ GA ÇAĞRINA UYARLA
// Bu fonksiyon tek GA çalıştırmasını temsil ediyor.
// Kendi kodunda GA'yı çalıştırdığın yeri buraya entegre edeceksin.
function runGAOnce(C,R,S,pop=60,generations=120){
    let P = createPopulation(C,R,S,pop);
  
    for(let g=0;g<generations;g++){
      P.sort((a,b)=>fitness(b,C,R,S)-fitness(a,C,R,S));
      let elite = P.slice(0,pop*0.25);
      let next=[...elite];
  
      while(next.length<pop){
        let p1 = elite[Math.floor(Math.random()*elite.length)];
        let p2 = elite[Math.floor(Math.random()*elite.length)];
        let cut = Math.floor(Math.random()*p1.length);
        let child = [...p1.slice(0,cut),...p2.slice(cut)];
        if(Math.random()<0.3){
          const i=Math.floor(Math.random()*child.length);
          child[i].day=days[Math.floor(Math.random()*days.length)];
          child[i].time=timeSlots[Math.floor(Math.random()*timeSlots.length)];
          child[i].room_id=R[Math.floor(Math.random()*R.length)].id;
        }
        next.push(child);
      }
      P=next;
    }
  
    P.sort((a,b)=>fitness(b,C,R,S)-fitness(a,C,R,S));
    return P[0];
  }
  
  // 2) Basit istatistik fonksiyonları
  function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  
  function std(arr) {
    const m = mean(arr);
    const variance = mean(arr.map(x => (x - m) ** 2));
    return Math.sqrt(variance);
  }
  
  function quantile(arr, q) {
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  }
  
  // 3) Çoklu run yapıp istatistikleri hesapla
  async function runExperiments(numRuns = 30) {
    const initialArr = [];
    const finalArr = [];
    const runtimeArr = [];
  
    for (let i = 0; i < numRuns; i++) {
      const res = await runGAOnce();
      initialArr.push(res.initialConflicts);
      finalArr.push(res.finalConflicts);
      runtimeArr.push(res.fullRuntimeSec);
    }
  
    console.log("=== Conflict Statistics Across GA Runs ===");
    console.log("Initial Conflicts:");
    console.log("  Mean:", mean(initialArr).toFixed(2));
    console.log("  SD:", std(initialArr).toFixed(2));
    console.log("  Min:", Math.min(...initialArr));
    console.log("  Max:", Math.max(...initialArr));
    console.log("  Q1:", quantile(initialArr, 0.25).toFixed(2));
    console.log("  Median (Q2):", quantile(initialArr, 0.5).toFixed(2));
    console.log("  Q3:", quantile(initialArr, 0.75).toFixed(2));
  
    console.log("\nFinal Conflicts:");
    console.log("  Mean:", mean(finalArr).toFixed(2));
    console.log("  SD:", std(finalArr).toFixed(2));
    console.log("  Min:", Math.min(...finalArr));
    console.log("  Max:", Math.max(...finalArr));
    console.log("  Q1:", quantile(finalArr, 0.25).toFixed(2));
    console.log("  Median (Q2):", quantile(finalArr, 0.5).toFixed(2));
    console.log("  Q3:", quantile(finalArr, 0.75).toFixed(2));
  
    console.log("\n=== Full GA Runtime (100 generations) ===");
    console.log("  Mean (s):", mean(runtimeArr).toFixed(3));
    console.log("  SD (s):", std(runtimeArr).toFixed(3));
    console.log("  Min (s):", Math.min(...runtimeArr).toFixed(3));
    console.log("  Max (s):", Math.max(...runtimeArr).toFixed(3));
    console.log("  Q1 (s):", quantile(runtimeArr, 0.25).toFixed(3));
    console.log("  Median (Q2) (s):", quantile(runtimeArr, 0.5).toFixed(3));
    console.log("  Q3 (s):", quantile(runtimeArr, 0.75).toFixed(3));
  
    const improvementRate =
      (mean(initialArr) - mean(finalArr)) / mean(initialArr) * 100;
    console.log("\nOverall Improvement Rate (%):", improvementRate.toFixed(2));
  }
  
  // Çalıştır
  runExperiments(30).then(() => {
    console.log("\nDone.");
  }).catch(console.error);
  