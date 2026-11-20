
/* =====================================
   VOCAB LAB ADVANCED ENGINE
   ===================================== */

const DB_KEY = "vocabLabData";
const SETTINGS_KEY = "vocabLabSettings";

const INITIAL_WORDS = [
  ["significant","중요한, 상당한","형용사","important, meaningful"],
  ["establish","설립하다, 확립하다","동사","found, create"],
  ["contribute","기여하다","동사","help, donate"],
  ["assume","가정하다, 추정하다","동사","suppose, presume"],
  ["occur","발생하다, 일어나다","동사","happen, arise"],
  ["require","요구하다, 필요로 하다","동사","need, demand"],
  ["maintain","유지하다, 주장하다","동사","preserve, sustain"],
  ["various","다양한","형용사","diverse, different"],
  ["environment","환경","명사","surroundings"],
  ["essential","필수적인","형용사","necessary, vital"],
  ["benefit","이익, 혜택","명사·동사","advantage, gain"],
  ["individual","개인, 개인의","명사·형용사","person, single"],
  ["approach","접근하다, 접근법","동사·명사","method, strategy"],
  ["available","이용 가능한","형용사","accessible"],
  ["consider","고려하다","동사","think about"],
  ["affect","영향을 미치다","동사","influence, impact"],
  ["claim","주장하다, 주장","동사·명사","assert, argue"],
  ["evidence","증거, 근거","명사","proof"],
  ["respond","반응하다, 대답하다","동사","reply, react"],
  ["analyze","분석하다","동사","examine"],
  ["consequence","결과","명사","result, outcome"],
  ["determine","결정하다, 알아내다","동사","decide, establish"],
  ["perceive","인식하다, 지각하다","동사","recognize"],
  ["interpret","해석하다","동사","explain, understand"],
  ["potential","잠재적인, 가능성","명사·형용사","possible, capacity"],
  ["indicate","나타내다, 가리키다","동사","show, suggest"],
  ["emphasize","강조하다","동사","stress, highlight"],
  ["obtain","얻다, 획득하다","동사","acquire, gain"],
  ["appropriate","적절한","형용사","suitable, proper"],
  ["specific","구체적인, 특정한","형용사","particular, exact"]
].map((w,i)=>({
  id:"base-"+i,
  word:w[0],
  meaning:w[1],
  pos:w[2],
  syn:w[3],
  example:"",
  favorite:false,
  level:0,
  interval:0,
  due:todayKey(),
  attempts:0,
  errors:0,
  lastReviewed:null
}));

function todayKey(date=new Date()){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,"0");
  const d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function loadJSON(key,fallback){
  try{
    const value=JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  }catch{
    return fallback;
  }
}

const oldDB=loadJSON(DB_KEY,{});

let settings={
  goal:20,
  accent:"blue",
  theme:"light",
  voice:"en-US",
  rate:1,
  ...(loadJSON(SETTINGS_KEY,{}))
};

let words=INITIAL_WORDS.map(w=>{
  const old=(oldDB.customWords||[]).find(x=>
    x.word?.toLowerCase()===w.word.toLowerCase()
  );
  return {...w,...old};
});

const oldKnown=oldDB.known||[];

words.forEach(w=>{
  if(oldKnown.includes(w.word)) w.level=Math.max(w.level||0,3);
});

(oldDB.customWords||[]).forEach(w=>{
  if(!words.some(x=>x.word.toLowerCase()===w.word.toLowerCase())){
    words.push({
      ...w,
      id:w.id||"custom-"+Date.now()+"-"+Math.random(),
      favorite:!!w.favorite,
      level:w.level||0,
      interval:w.interval||0,
      due:w.due||todayKey(),
      attempts:w.attempts||0,
      errors:w.errors||0
    });
  }
});

let daily=oldDB.daily||{};
let currentMonth=new Date();
let currentPage="home";
let studyList=[];
let studyIndex=0;
let quizList=[];
let quizIndex=0;
let quizScore=0;
let quizAnswered=false;

const main=document.querySelector("main");

function save(){
  const customWords=words.filter(w=>
    !String(w.id).startsWith("base-")
  );

  localStorage.setItem(DB_KEY,JSON.stringify({
    customWords,
    known:words.filter(w=>w.level>=3).map(w=>w.word),
    wrong:words.filter(w=>w.errors>0).map(w=>w.word),
    daily
  }));

  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
}

function escapeHTML(value){
  return String(value??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#39;"
  }[c]));
}

function shuffle(arr){
  return [...arr].sort(()=>Math.random()-.5);
}

function recordActivity(){
  const date=todayKey();
  if(!daily[date]){
    daily[date]={studied:0,correct:0,answered:0};
  }
}

function applyTheme(){
  document.body.classList.toggle(
    "dark-mode",settings.theme==="dark"
  );
}

function speak(word){
  if(!("speechSynthesis" in window)){
    alert("이 브라우저는 음성 기능을 지원하지 않습니다.");
    return;
  }

  speechSynthesis.cancel();

  const utterance=new SpeechSynthesisUtterance(word);
  utterance.lang=settings.voice;
  utterance.rate=Number(settings.rate);
  speechSynthesis.speak(utterance);
}

function setPage(page){
  currentPage=page;
  render();
}

function home(){
  const today=daily[todayKey()]||{studied:0};
  const due=words.filter(w=>
    w.level>0 && w.due<=todayKey()
  ).length;

  main.innerHTML=`
    <section class="welcome">
      <h2>오늘도 영어 어휘를 쌓아 볼까요?</h2>
      <p>VOCAB LAB Advanced</p>
      <h3>${today.studied||0} / ${settings.goal} 단어 학습</h3>
      <progress value="${Math.min(today.studied||0,settings.goal)}"
        max="${settings.goal}"></progress>
    </section>

    <section class="today">
      <h2>오늘의 학습 현황</h2>
      <p>전체 단어 ${words.length}개</p>
      <p>암기 완료 ${words.filter(w=>w.level>=3).length}개</p>
      <p>복습 예정 ${due}개</p>
      <p>즐겨찾기 ${words.filter(w=>w.favorite).length}개</p>
    </section>

    <nav class="advanced-nav">
      ${[
        ["study","📖 단어 학습"],
        ["quiz","✏️ 단어 테스트"],
        ["review","🔄 자동 복습"],
        ["search","🔍 단어 검색"],
        ["favorite","⭐ 즐겨찾기"],
        ["calendar","📅 학습 달력"],
        ["stats","📊 학습 통계"],
        ["add","➕ 단어 추가"],
        ["settings","⚙️ 설정"]
      ].map(([p,t])=>
        `<button data-page="${p}">${t}</button>`
      ).join("")}
    </nav>
  `;
}

function wordCard(w,showMeaning=true){
  return `
    <article class="today">
      <h2>${escapeHTML(w.word)}</h2>
      <p>${escapeHTML(w.pos)}</p>
      ${showMeaning?`
        <h3>${escapeHTML(w.meaning)}</h3>
        <p>유의어: ${escapeHTML(w.syn||"-")}</p>
        <p>예문: ${escapeHTML(w.example||"등록된 예문 없음")}</p>
      `:""}
      <button data-speak="${escapeHTML(w.word)}">🔊 발음</button>
      <button data-fav="${escapeHTML(w.id)}">
        ${w.favorite?"★ 즐겨찾기 해제":"☆ 즐겨찾기"}
      </button>
    </article>
  `;
}

function study(){
  studyList=shuffle(words);
  studyIndex=0;
  showStudy();
}

function showStudy(){
  if(!studyList.length){
    main.innerHTML="<section class='today'>학습할 단어가 없습니다.</section>";
    return;
  }

  const w=studyList[studyIndex];

  main.innerHTML=`
    <section class="today">
      <p>${studyIndex+1} / ${studyList.length}</p>
      <h2 style="font-size:32px">${escapeHTML(w.word)}</h2>
      <p>${escapeHTML(w.pos)}</p>
      <button data-speak="${escapeHTML(w.word)}">🔊 발음 듣기</button>
      <button id="reveal">뜻 확인하기</button>
      <div id="answer" hidden>
        <h2>${escapeHTML(w.meaning)}</h2>
        <p>유의어: ${escapeHTML(w.syn||"-")}</p>
        <p>${escapeHTML(w.example||"예문 없음")}</p>
      </div>
      <div id="study-actions" hidden>
        <button data-result="remember">알고 있어요</button>
        <button data-result="again">다시 공부할게요</button>
      </div>
    </section>
    <button data-page="home">홈으로</button>
  `;

  document.getElementById("reveal").onclick=()=>{
    document.getElementById("answer").hidden=false;
    document.getElementById("study-actions").hidden=false;
  };
}

function updateWord(w,correct){
  const date=todayKey();
  recordActivity();

  w.attempts=(w.attempts||0)+1;
  w.lastReviewed=date;
  daily[date].studied++;

  if(correct){
    w.level=Math.min(5,(w.level||0)+1);
    w.interval=[1,2,4,7,14,30][w.level]||30;
    w.due=todayKey(new Date(Date.now()+w.interval*86400000));
    daily[date].correct++;
  }else{
    w.errors=(w.errors||0)+1;
    w.level=0;
    w.interval=1;
    w.due=todayKey(new Date(Date.now()+86400000));
  }

  daily[date].answered++;
  save();
}

function review(){
  const due=words.filter(w=>
    w.level>0 && w.due<=todayKey()
  );

  studyList=due.length?shuffle(due):[];
  studyIndex=0;

  if(!due.length){
    main.innerHTML=`
      <section class="today">
        <h2>복습할 단어가 없습니다! 🎉</h2>
        <p>다음 복습일에 다시 확인해 주세요.</p>
      </section>
      <button data-page="home">홈으로</button>
    `;
    return;
  }

  showReview();
}

function showReview(){
  const w=studyList[studyIndex];

  main.innerHTML=`
    <section class="today">
      <p>복습 ${studyIndex+1} / ${studyList.length}</p>
      <h2>${escapeHTML(w.word)}</h2>
      <button id="reveal">뜻 확인</button>
      <div id="answer" hidden>
        <h2>${escapeHTML(w.meaning)}</h2>
        <p>복습 간격: ${w.interval}일</p>
        <button data-review="true">기억했어요</button>
        <button data-review="false">다시 복습할게요</button>
      </div>
    </section>
  `;

  document.getElementById("reveal").onclick=()=>{
    document.getElementById("answer").hidden=false;
  };
}

function quiz(){
  quizList=shuffle(words).slice(0,Math.min(10,words.length));
  quizIndex=0;
  quizScore=0;
  showQuiz();
}

function showQuiz(){
  if(quizIndex>=quizList.length){
    main.innerHTML=`
      <section class="today">
        <h2>테스트 완료!</h2>
        <h1>${quizScore} / ${quizList.length}</h1>
        <p>정답률 ${Math.round(quizScore/quizList.length*100)}%</p>
        <button data-page="quiz">다시 테스트</button>
        <button data-page="home">홈으로</button>
      </section>
    `;
    return;
  }

  const w=quizList[quizIndex];
  const choices=shuffle([
    w.meaning,
    ...shuffle(words.filter(x=>x.id!==w.id))
      .slice(0,3).map(x=>x.meaning)
  ]);

  quizAnswered=false;

  main.innerHTML=`
    <section class="today">
      <p>문제 ${quizIndex+1} / ${quizList.length}</p>
      <h2>${escapeHTML(w.word)}</h2>
      ${choices.map((c,i)=>
        `<button class="choice" data-choice="${i}">
          ${escapeHTML(c)}
        </button>`
      ).join("")}
      <p id="feedback"></p>
    </section>
  `;

  document.querySelectorAll("[data-choice]").forEach(btn=>{
    btn.onclick=()=>{
      if(quizAnswered)return;
      quizAnswered=true;

      const correct=choices[Number(btn.dataset.choice)]===w.meaning;
      if(correct)quizScore++;

      updateWord(w,correct);

      document.getElementById("feedback").textContent=
        correct?"정답입니다! 🎉":"정답: "+w.meaning;

      const next=document.createElement("button");
      next.textContent="다음 문제";
      next.onclick=()=>{
        quizIndex++;
        showQuiz();
      };
      document.getElementById("feedback").after(next);
    };
  });
}

function search(){
  main.innerHTML=`
    <section class="today">
      <h2>단어 검색</h2>
      <input id="searchInput" placeholder="영어 또는 한국어 검색">
      <div id="searchResults"></div>
    </section>
  `;

  document.getElementById("searchInput").oninput=e=>{
    const q=e.target.value.toLowerCase().trim();
    const results=words.filter(w=>
      w.word.toLowerCase().includes(q)||
      w.meaning.toLowerCase().includes(q)
    );

    document.getElementById("searchResults").innerHTML=
      results.map(w=>`
        <div class="search-result">
          <strong>${escapeHTML(w.word)}</strong>
          <p>${escapeHTML(w.meaning)}</p>
          <button data-speak="${escapeHTML(w.word)}">🔊</button>
          <button data-fav="${escapeHTML(w.id)}">
            ${w.favorite?"★":"☆"}
          </button>
        </div>
      `).join("")||"<p>검색 결과가 없습니다.</p>";
  };
}

function favorites(){
  const list=words.filter(w=>w.favorite);

  main.innerHTML=`
    <section class="today">
      <h2>⭐ 즐겨찾기</h2>
      ${list.map(w=>`
        <p><strong>${escapeHTML(w.word)}</strong> — ${escapeHTML(w.meaning)}
        <button data-fav="${escapeHTML(w.id)}">★</button></p>
      `).join("")||"<p>즐겨찾기 단어가 없습니다.</p>"}
    </section>
  `;
}

function calendar(){
  const year=currentMonth.getFullYear();
  const month=currentMonth.getMonth();
  const first=new Date(year,month,1).getDay();
  const count=new Date(year,month+1,0).getDate();

  let cells="";
  for(let i=0;i<first;i++)cells+="<span></span>";

  for(let d=1;d<=count;d++){
    const key=todayKey(new Date(year,month,d));
    const value=daily[key]?.studied||0;
    cells+=`
      <button class="calendar-day ${value?"active":""}"
        data-date="${key}">
        ${d}
        <small>${value||""}</small>
      </button>
    `;
  }

  main.innerHTML=`
    <section class="today">
      <h2>학습 달력</h2>
      <button id="prevMonth">◀</button>
      <strong>${year}년 ${month+1}월</strong>
      <button id="nextMonth">▶</button>
      <div class="calendar-grid">
        ${["일","월","화","수","목","금","토"]
          .map(x=>`<strong>${x}</strong>`).join("")}
        ${cells}
      </div>
      <p id="dateDetail">날짜를 선택해 주세요.</p>
    </section>
  `;

  document.getElementById("prevMonth").onclick=()=>{
    currentMonth.setMonth(month-1);
    calendar();
  };
  document.getElementById("nextMonth").onclick=()=>{
    currentMonth.setMonth(month+1);
    calendar();
  };
  document.querySelectorAll("[data-date]").forEach(btn=>{
    btn.onclick=()=>{
      const data=daily[btn.dataset.date]||{};
      document.getElementById("dateDetail").textContent=
        `${btn.dataset.date}: ${data.studied||0}개 학습`;
    };
  });
}

function stats(){
  const total=words.reduce((s,w)=>s+(w.attempts||0),0);
  const errors=words.reduce((s,w)=>s+(w.errors||0),0);
  const correct=total-errors;
  const accuracy=total?Math.round(correct/total*100):0;

  const weak=shuffle(
    words.filter(w=>w.errors>0)
  ).sort((a,b)=>b.errors-a.errors).slice(0,5);

  main.innerHTML=`
    <section class="today">
      <h2>학습 통계</h2>
      <h1>${accuracy}%</h1>
      <p>누적 정답률</p>
      <p>전체 단어: ${words.length}개</p>
      <p>암기 완료: ${words.filter(w=>w.level>=3).length}개</p>
      <p>누적 응답: ${total}회</p>
      <p>틀린 응답: ${errors}회</p>
      <h3>취약 단어 TOP 5</h3>
      ${weak.map(w=>`
        <p>${escapeHTML(w.word)} — ${w.errors}회 오답</p>
      `).join("")||"<p>아직 취약 단어가 없습니다.</p>"}
    </section>
  `;
}

function addWord(){
  main.innerHTML=`
    <section class="today">
      <h2>새 단어 추가</h2>
      <input id="newWord" placeholder="영어 단어">
      <input id="newMeaning" placeholder="한국어 뜻">
      <input id="newPos" placeholder="품사">
      <input id="newSyn" placeholder="유의어">
      <button id="saveWord">저장하기</button>
      <p id="message"></p>
    </section>
  `;

  document.getElementById("saveWord").onclick=()=>{
    const word=document.getElementById("newWord").value.trim();
    const meaning=document.getElementById("newMeaning").value.trim();

    if(!word||!meaning){
      alert("영어 단어와 뜻을 입력해 주세요.");
      return;
    }

    if(words.some(w=>w.word.toLowerCase()===word.toLowerCase())){
      alert("이미 등록된 단어입니다.");
      return;
    }

    words.push({
      id:"custom-"+Date.now(),
      word,meaning,
      pos:document.getElementById("newPos").value||"미분류",
      syn:document.getElementById("newSyn").value||"-",
      example:"",
      favorite:false,level:0,interval:0,
      due:todayKey(),attempts:0,errors:0
    });

    save();
    document.getElementById("message").textContent="단어가 저장되었습니다!";
  };
}

function settingsPage(){
  main.innerHTML=`
    <section class="today">
      <h2>환경 설정</h2>

      <label>하루 학습 목표</label>
      <input id="goal" type="number" min="1" max="500"
        value="${settings.goal}">

      <label>발음 설정</label>
      <select id="voice">
        <option value="en-US">미국식 영어</option>
        <option value="en-GB">영국식 영어</option>
      </select>

      <label>발음 속도</label>
      <select id="rate">
        <option value="0.7">느리게</option>
        <option value="0.85">조금 느리게</option>
        <option value="1">보통</option>
        <option value="1.15">빠르게</option>
      </select>

      <button id="theme">다크 모드 전환</button>
      <button id="saveSettings">설정 저장</button>

      <hr>
      <h3>데이터 백업</h3>
      <button id="backup">백업 파일 다운로드</button>

      <h3>데이터 복원</h3>
      <input id="restoreFile" type="file" accept=".json,application/json">
      <button id="restore">백업 파일 복원</button>
    </section>
  `;

  document.getElementById("voice").value=settings.voice;
  document.getElementById("rate").value=settings.rate;

  document.getElementById("theme").onclick=()=>{
    settings.theme=settings.theme==="dark"?"light":"dark";
    applyTheme();
    save();
  };

  document.getElementById("saveSettings").onclick=()=>{
    settings.goal=Math.max(1,Math.min(500,
      Number(document.getElementById("goal").value)||20
    ));
    settings.voice=document.getElementById("voice").value;
    settings.rate=Number(document.getElementById("rate").value);
    save();
    alert("설정이 저장되었습니다.");
    home();
  };

  document.getElementById("backup").onclick=()=>{
    const data={
      words,daily,settings,
      version:1,
      exportedAt:new Date().toISOString()
    };

    const blob=new Blob(
      [JSON.stringify(data,null,2)],
      {type:"application/json"}
    );

    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="VOCAB-LAB-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById("restore").onclick=async()=>{
    const file=document.getElementById("restoreFile").files[0];
    if(!file)return alert("백업 파일을 선택해 주세요.");
    if(!confirm("현재 데이터가 백업 내용으로 교체됩니다. 계속할까요?"))return;

    try{
      const data=JSON.parse(await file.text());
      if(!Array.isArray(data.words)||!data.settings||!data.daily)
        throw new Error("잘못된 백업 파일");

      words=data.words;
      daily=data.daily;
      settings={...settings,...data.settings};
      save();
      alert("복원이 완료되었습니다. 페이지를 새로고침합니다.");
      location.reload();
    }catch{
      alert("백업 파일을 읽을 수 없습니다.");
    }
  };
}

function render(){
  applyTheme();

  const pages={
    home,study,quiz,review,search,
    favorite:favorites,
    calendar,stats,add:addWord,
    settings:settingsPage
  };

  (pages[currentPage]||home)();
}

document.addEventListener("click",event=>{
  const page=event.target.closest("[data-page]");
  const speech=event.target.closest("[data-speak]");
  const fav=event.target.closest("[data-fav]");
  const result=event.target.closest("[data-result]");
  const reviewResult=event.target.closest("[data-review]");

  if(page){
    currentPage=page.dataset.page;
    render();
  }

  if(speech)speak(speech.dataset.speak);

  if(fav){
    const w=words.find(x=>x.id===fav.dataset.fav);
    if(w){
      w.favorite=!w.favorite;
      save();
      render();
    }
  }

  if(result){
    const w=studyList[studyIndex];
    updateWord(w,result.dataset.result==="remember");
    studyIndex++;
    showStudy();
  }

  if(reviewResult){
    const w=studyList[studyIndex];
    updateWord(w,reviewResult.dataset.review==="true");
    studyIndex++;
    if(studyIndex>=studyList.length){
      alert("복습을 완료했습니다!");
      setPage("home");
    }else showReview();
  }
});

applyTheme();
save();
render();
/* =====================================
   VOCAB LAB ADVANCED ENGINE
   ===================================== */

const DB_KEY = "vocabLabData";
const SETTINGS_KEY = "vocabLabSettings";

const INITIAL_WORDS = [
  ["significant","중요한, 상당한","형용사","important, meaningful"],
  ["establish","설립하다, 확립하다","동사","found, create"],
  ["contribute","기여하다","동사","help, donate"],
  ["assume","가정하다, 추정하다","동사","suppose, presume"],
  ["occur","발생하다, 일어나다","동사","happen, arise"],
  ["require","요구하다, 필요로 하다","동사","need, demand"],
  ["maintain","유지하다, 주장하다","동사","preserve, sustain"],
  ["various","다양한","형용사","diverse, different"],
  ["environment","환경","명사","surroundings"],
  ["essential","필수적인","형용사","necessary, vital"],
  ["benefit","이익, 혜택","명사·동사","advantage, gain"],
  ["individual","개인, 개인의","명사·형용사","person, single"],
  ["approach","접근하다, 접근법","동사·명사","method, strategy"],
  ["available","이용 가능한","형용사","accessible"],
  ["consider","고려하다","동사","think about"],
  ["affect","영향을 미치다","동사","influence, impact"],
  ["claim","주장하다, 주장","동사·명사","assert, argue"],
  ["evidence","증거, 근거","명사","proof"],
  ["respond","반응하다, 대답하다","동사","reply, react"],
  ["analyze","분석하다","동사","examine"],
  ["consequence","결과","명사","result, outcome"],
  ["determine","결정하다, 알아내다","동사","decide, establish"],
  ["perceive","인식하다, 지각하다","동사","recognize"],
  ["interpret","해석하다","동사","explain, understand"],
  ["potential","잠재적인, 가능성","명사·형용사","possible, capacity"],
  ["indicate","나타내다, 가리키다","동사","show, suggest"],
  ["emphasize","강조하다","동사","stress, highlight"],
  ["obtain","얻다, 획득하다","동사","acquire, gain"],
  ["appropriate","적절한","형용사","suitable, proper"],
  ["specific","구체적인, 특정한","형용사","particular, exact"]
].map((w,i)=>({
  id:"base-"+i,
  word:w[0],
  meaning:w[1],
  pos:w[2],
  syn:w[3],
  example:"",
  favorite:false,
  level:0,
  interval:0,
  due:todayKey(),
  attempts:0,
  errors:0,
  lastReviewed:null
}));

function todayKey(date=new Date()){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,"0");
  const d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function loadJSON(key,fallback){
  try{
    const value=JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  }catch{
    return fallback;
  }
}

const oldDB=loadJSON(DB_KEY,{});

let settings={
  goal:20,
  accent:"blue",
  theme:"light",
  voice:"en-US",
  rate:1,
  ...(loadJSON(SETTINGS_KEY,{}))
};

let words=INITIAL_WORDS.map(w=>{
  const old=(oldDB.customWords||[]).find(x=>
    x.word?.toLowerCase()===w.word.toLowerCase()
  );
  return {...w,...old};
});

const oldKnown=oldDB.known||[];

words.forEach(w=>{
  if(oldKnown.includes(w.word)) w.level=Math.max(w.level||0,3);
});

(oldDB.customWords||[]).forEach(w=>{
  if(!words.some(x=>x.word.toLowerCase()===w.word.toLowerCase())){
    words.push({
      ...w,
      id:w.id||"custom-"+Date.now()+"-"+Math.random(),
      favorite:!!w.favorite,
      level:w.level||0,
      interval:w.interval||0,
      due:w.due||todayKey(),
      attempts:w.attempts||0,
      errors:w.errors||0
    });
  }
});

let daily=oldDB.daily||{};
let currentMonth=new Date();
let currentPage="home";
let studyList=[];
let studyIndex=0;
let quizList=[];
let quizIndex=0;
let quizScore=0;
let quizAnswered=false;

const main=document.querySelector("main");

function save(){
  const customWords=words.filter(w=>
    !String(w.id).startsWith("base-")
  );

  localStorage.setItem(DB_KEY,JSON.stringify({
    customWords,
    known:words.filter(w=>w.level>=3).map(w=>w.word),
    wrong:words.filter(w=>w.errors>0).map(w=>w.word),
    daily
  }));

  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
}

function escapeHTML(value){
  return String(value??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#39;"
  }[c]));
}

function shuffle(arr){
  return [...arr].sort(()=>Math.random()-.5);
}

function recordActivity(){
  const date=todayKey();
  if(!daily[date]){
    daily[date]={studied:0,correct:0,answered:0};
  }
}

function applyTheme(){
  document.body.classList.toggle(
    "dark-mode",settings.theme==="dark"
  );
}

function speak(word){
  if(!("speechSynthesis" in window)){
    alert("이 브라우저는 음성 기능을 지원하지 않습니다.");
    return;
  }

  speechSynthesis.cancel();

  const utterance=new SpeechSynthesisUtterance(word);
  utterance.lang=settings.voice;
  utterance.rate=Number(settings.rate);
  speechSynthesis.speak(utterance);
}

function setPage(page){
  currentPage=page;
  render();
}

function home(){
  const today=daily[todayKey()]||{studied:0};
  const due=words.filter(w=>
    w.level>0 && w.due<=todayKey()
  ).length;

  main.innerHTML=`
    <section class="welcome">
      <h2>오늘도 영어 어휘를 쌓아 볼까요?</h2>
      <p>VOCAB LAB Advanced</p>
      <h3>${today.studied||0} / ${settings.goal} 단어 학습</h3>
      <progress value="${Math.min(today.studied||0,settings.goal)}"
        max="${settings.goal}"></progress>
    </section>

    <section class="today">
      <h2>오늘의 학습 현황</h2>
      <p>전체 단어 ${words.length}개</p>
      <p>암기 완료 ${words.filter(w=>w.level>=3).length}개</p>
      <p>복습 예정 ${due}개</p>
      <p>즐겨찾기 ${words.filter(w=>w.favorite).length}개</p>
    </section>

    <nav class="advanced-nav">
      ${[
        ["study","📖 단어 학습"],
        ["quiz","✏️ 단어 테스트"],
        ["review","🔄 자동 복습"],
        ["search","🔍 단어 검색"],
        ["favorite","⭐ 즐겨찾기"],
        ["calendar","📅 학습 달력"],
        ["stats","📊 학습 통계"],
        ["add","➕ 단어 추가"],
        ["settings","⚙️ 설정"]
      ].map(([p,t])=>
        `<button data-page="${p}">${t}</button>`
      ).join("")}
    </nav>
  `;
}

function wordCard(w,showMeaning=true){
  return `
    <article class="today">
      <h2>${escapeHTML(w.word)}</h2>
      <p>${escapeHTML(w.pos)}</p>
      ${showMeaning?`
        <h3>${escapeHTML(w.meaning)}</h3>
        <p>유의어: ${escapeHTML(w.syn||"-")}</p>
        <p>예문: ${escapeHTML(w.example||"등록된 예문 없음")}</p>
      `:""}
      <button data-speak="${escapeHTML(w.word)}">🔊 발음</button>
      <button data-fav="${escapeHTML(w.id)}">
        ${w.favorite?"★ 즐겨찾기 해제":"☆ 즐겨찾기"}
      </button>
    </article>
  `;
}

function study(){
  studyList=shuffle(words);
  studyIndex=0;
  showStudy();
}

function showStudy(){
  if(!studyList.length){
    main.innerHTML="<section class='today'>학습할 단어가 없습니다.</section>";
    return;
  }

  const w=studyList[studyIndex];

  main.innerHTML=`
    <section class="today">
      <p>${studyIndex+1} / ${studyList.length}</p>
      <h2 style="font-size:32px">${escapeHTML(w.word)}</h2>
      <p>${escapeHTML(w.pos)}</p>
      <button data-speak="${escapeHTML(w.word)}">🔊 발음 듣기</button>
      <button id="reveal">뜻 확인하기</button>
      <div id="answer" hidden>
        <h2>${escapeHTML(w.meaning)}</h2>
        <p>유의어: ${escapeHTML(w.syn||"-")}</p>
        <p>${escapeHTML(w.example||"예문 없음")}</p>
      </div>
      <div id="study-actions" hidden>
        <button data-result="remember">알고 있어요</button>
        <button data-result="again">다시 공부할게요</button>
      </div>
    </section>
    <button data-page="home">홈으로</button>
  `;

  document.getElementById("reveal").onclick=()=>{
    document.getElementById("answer").hidden=false;
    document.getElementById("study-actions").hidden=false;
  };
}

function updateWord(w,correct){
  const date=todayKey();
  recordActivity();

  w.attempts=(w.attempts||0)+1;
  w.lastReviewed=date;
  daily[date].studied++;

  if(correct){
    w.level=Math.min(5,(w.level||0)+1);
    w.interval=[1,2,4,7,14,30][w.level]||30;
    w.due=todayKey(new Date(Date.now()+w.interval*86400000));
    daily[date].correct++;
  }else{
    w.errors=(w.errors||0)+1;
    w.level=0;
    w.interval=1;
    w.due=todayKey(new Date(Date.now()+86400000));
  }

  daily[date].answered++;
  save();
}

function review(){
  const due=words.filter(w=>
    w.level>0 && w.due<=todayKey()
  );

  studyList=due.length?shuffle(due):[];
  studyIndex=0;

  if(!due.length){
    main.innerHTML=`
      <section class="today">
        <h2>복습할 단어가 없습니다! 🎉</h2>
        <p>다음 복습일에 다시 확인해 주세요.</p>
      </section>
      <button data-page="home">홈으로</button>
    `;
    return;
  }

  showReview();
}

function showReview(){
  const w=studyList[studyIndex];

  main.innerHTML=`
    <section class="today">
      <p>복습 ${studyIndex+1} / ${studyList.length}</p>
      <h2>${escapeHTML(w.word)}</h2>
      <button id="reveal">뜻 확인</button>
      <div id="answer" hidden>
        <h2>${escapeHTML(w.meaning)}</h2>
        <p>복습 간격: ${w.interval}일</p>
        <button data-review="true">기억했어요</button>
        <button data-review="false">다시 복습할게요</button>
      </div>
    </section>
  `;

  document.getElementById("reveal").onclick=()=>{
    document.getElementById("answer").hidden=false;
  };
}

function quiz(){
  quizList=shuffle(words).slice(0,Math.min(10,words.length));
  quizIndex=0;
  quizScore=0;
  showQuiz();
}

function showQuiz(){
  if(quizIndex>=quizList.length){
    main.innerHTML=`
      <section class="today">
        <h2>테스트 완료!</h2>
        <h1>${quizScore} / ${quizList.length}</h1>
        <p>정답률 ${Math.round(quizScore/quizList.length*100)}%</p>
        <button data-page="quiz">다시 테스트</button>
        <button data-page="home">홈으로</button>
      </section>
    `;
    return;
  }

  const w=quizList[quizIndex];
  const choices=shuffle([
    w.meaning,
    ...shuffle(words.filter(x=>x.id!==w.id))
      .slice(0,3).map(x=>x.meaning)
  ]);

  quizAnswered=false;

  main.innerHTML=`
    <section class="today">
      <p>문제 ${quizIndex+1} / ${quizList.length}</p>
      <h2>${escapeHTML(w.word)}</h2>
      ${choices.map((c,i)=>
        `<button class="choice" data-choice="${i}">
          ${escapeHTML(c)}
        </button>`
      ).join("")}
      <p id="feedback"></p>
    </section>
  `;

  document.querySelectorAll("[data-choice]").forEach(btn=>{
    btn.onclick=()=>{
      if(quizAnswered)return;
      quizAnswered=true;

      const correct=choices[Number(btn.dataset.choice)]===w.meaning;
      if(correct)quizScore++;

      updateWord(w,correct);

      document.getElementById("feedback").textContent=
        correct?"정답입니다! 🎉":"정답: "+w.meaning;

      const next=document.createElement("button");
      next.textContent="다음 문제";
      next.onclick=()=>{
        quizIndex++;
        showQuiz();
      };
      document.getElementById("feedback").after(next);
    };
  });
}

function search(){
  main.innerHTML=`
    <section class="today">
      <h2>단어 검색</h2>
      <input id="searchInput" placeholder="영어 또는 한국어 검색">
      <div id="searchResults"></div>
    </section>
  `;

  document.getElementById("searchInput").oninput=e=>{
    const q=e.target.value.toLowerCase().trim();
    const results=words.filter(w=>
      w.word.toLowerCase().includes(q)||
      w.meaning.toLowerCase().includes(q)
    );

    document.getElementById("searchResults").innerHTML=
      results.map(w=>`
        <div class="search-result">
          <strong>${escapeHTML(w.word)}</strong>
          <p>${escapeHTML(w.meaning)}</p>
          <button data-speak="${escapeHTML(w.word)}">🔊</button>
          <button data-fav="${escapeHTML(w.id)}">
            ${w.favorite?"★":"☆"}
          </button>
        </div>
      `).join("")||"<p>검색 결과가 없습니다.</p>";
  };
}

function favorites(){
  const list=words.filter(w=>w.favorite);

  main.innerHTML=`
    <section class="today">
      <h2>⭐ 즐겨찾기</h2>
      ${list.map(w=>`
        <p><strong>${escapeHTML(w.word)}</strong> — ${escapeHTML(w.meaning)}
        <button data-fav="${escapeHTML(w.id)}">★</button></p>
      `).join("")||"<p>즐겨찾기 단어가 없습니다.</p>"}
    </section>
  `;
}

function calendar(){
  const year=currentMonth.getFullYear();
  const month=currentMonth.getMonth();
  const first=new Date(year,month,1).getDay();
  const count=new Date(year,month+1,0).getDate();

  let cells="";
  for(let i=0;i<first;i++)cells+="<span></span>";

  for(let d=1;d<=count;d++){
    const key=todayKey(new Date(year,month,d));
    const value=daily[key]?.studied||0;
    cells+=`
      <button class="calendar-day ${value?"active":""}"
        data-date="${key}">
        ${d}
        <small>${value||""}</small>
      </button>
    `;
  }

  main.innerHTML=`
    <section class="today">
      <h2>학습 달력</h2>
      <button id="prevMonth">◀</button>
      <strong>${year}년 ${month+1}월</strong>
      <button id="nextMonth">▶</button>
      <div class="calendar-grid">
        ${["일","월","화","수","목","금","토"]
          .map(x=>`<strong>${x}</strong>`).join("")}
        ${cells}
      </div>
      <p id="dateDetail">날짜를 선택해 주세요.</p>
    </section>
  `;

  document.getElementById("prevMonth").onclick=()=>{
    currentMonth.setMonth(month-1);
    calendar();
  };
  document.getElementById("nextMonth").onclick=()=>{
    currentMonth.setMonth(month+1);
    calendar();
  };
  document.querySelectorAll("[data-date]").forEach(btn=>{
    btn.onclick=()=>{
      const data=daily[btn.dataset.date]||{};
      document.getElementById("dateDetail").textContent=
        `${btn.dataset.date}: ${data.studied||0}개 학습`;
    };
  });
}

function stats(){
  const total=words.reduce((s,w)=>s+(w.attempts||0),0);
  const errors=words.reduce((s,w)=>s+(w.errors||0),0);
  const correct=total-errors;
  const accuracy=total?Math.round(correct/total*100):0;

  const weak=shuffle(
    words.filter(w=>w.errors>0)
  ).sort((a,b)=>b.errors-a.errors).slice(0,5);

  main.innerHTML=`
    <section class="today">
      <h2>학습 통계</h2>
      <h1>${accuracy}%</h1>
      <p>누적 정답률</p>
      <p>전체 단어: ${words.length}개</p>
      <p>암기 완료: ${words.filter(w=>w.level>=3).length}개</p>
      <p>누적 응답: ${total}회</p>
      <p>틀린 응답: ${errors}회</p>
      <h3>취약 단어 TOP 5</h3>
      ${weak.map(w=>`
        <p>${escapeHTML(w.word)} — ${w.errors}회 오답</p>
      `).join("")||"<p>아직 취약 단어가 없습니다.</p>"}
    </section>
  `;
}

function addWord(){
  main.innerHTML=`
    <section class="today">
      <h2>새 단어 추가</h2>
      <input id="newWord" placeholder="영어 단어">
      <input id="newMeaning" placeholder="한국어 뜻">
      <input id="newPos" placeholder="품사">
      <input id="newSyn" placeholder="유의어">
      <button id="saveWord">저장하기</button>
      <p id="message"></p>
    </section>
  `;

  document.getElementById("saveWord").onclick=()=>{
    const word=document.getElementById("newWord").value.trim();
    const meaning=document.getElementById("newMeaning").value.trim();

    if(!word||!meaning){
      alert("영어 단어와 뜻을 입력해 주세요.");
      return;
    }

    if(words.some(w=>w.word.toLowerCase()===word.toLowerCase())){
      alert("이미 등록된 단어입니다.");
      return;
    }

    words.push({
      id:"custom-"+Date.now(),
      word,meaning,
      pos:document.getElementById("newPos").value||"미분류",
      syn:document.getElementById("newSyn").value||"-",
      example:"",
      favorite:false,level:0,interval:0,
      due:todayKey(),attempts:0,errors:0
    });

    save();
    document.getElementById("message").textContent="단어가 저장되었습니다!";
  };
}

function settingsPage(){
  main.innerHTML=`
    <section class="today">
      <h2>환경 설정</h2>

      <label>하루 학습 목표</label>
      <input id="goal" type="number" min="1" max="500"
        value="${settings.goal}">

      <label>발음 설정</label>
      <select id="voice">
        <option value="en-US">미국식 영어</option>
        <option value="en-GB">영국식 영어</option>
      </select>

      <label>발음 속도</label>
      <select id="rate">
        <option value="0.7">느리게</option>
        <option value="0.85">조금 느리게</option>
        <option value="1">보통</option>
        <option value="1.15">빠르게</option>
      </select>

      <button id="theme">다크 모드 전환</button>
      <button id="saveSettings">설정 저장</button>

      <hr>
      <h3>데이터 백업</h3>
      <button id="backup">백업 파일 다운로드</button>

      <h3>데이터 복원</h3>
      <input id="restoreFile" type="file" accept=".json,application/json">
      <button id="restore">백업 파일 복원</button>
    </section>
  `;

  document.getElementById("voice").value=settings.voice;
  document.getElementById("rate").value=settings.rate;

  document.getElementById("theme").onclick=()=>{
    settings.theme=settings.theme==="dark"?"light":"dark";
    applyTheme();
    save();
  };

  document.getElementById("saveSettings").onclick=()=>{
    settings.goal=Math.max(1,Math.min(500,
      Number(document.getElementById("goal").value)||20
    ));
    settings.voice=document.getElementById("voice").value;
    settings.rate=Number(document.getElementById("rate").value);
    save();
    alert("설정이 저장되었습니다.");
    home();
  };

  document.getElementById("backup").onclick=()=>{
    const data={
      words,daily,settings,
      version:1,
      exportedAt:new Date().toISOString()
    };

    const blob=new Blob(
      [JSON.stringify(data,null,2)],
      {type:"application/json"}
    );

    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="VOCAB-LAB-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById("restore").onclick=async()=>{
    const file=document.getElementById("restoreFile").files[0];
    if(!file)return alert("백업 파일을 선택해 주세요.");
    if(!confirm("현재 데이터가 백업 내용으로 교체됩니다. 계속할까요?"))return;

    try{
      const data=JSON.parse(await file.text());
      if(!Array.isArray(data.words)||!data.settings||!data.daily)
        throw new Error("잘못된 백업 파일");

      words=data.words;
      daily=data.daily;
      settings={...settings,...data.settings};
      save();
      alert("복원이 완료되었습니다. 페이지를 새로고침합니다.");
      location.reload();
    }catch{
      alert("백업 파일을 읽을 수 없습니다.");
    }
  };
}

function render(){
  applyTheme();

  const pages={
    home,study,quiz,review,search,
    favorite:favorites,
    calendar,stats,add:addWord,
    settings:settingsPage
  };

  (pages[currentPage]||home)();
}

document.addEventListener("click",event=>{
  const page=event.target.closest("[data-page]");
  const speech=event.target.closest("[data-speak]");
  const fav=event.target.closest("[data-fav]");
  const result=event.target.closest("[data-result]");
  const reviewResult=event.target.closest("[data-review]");

  if(page){
    currentPage=page.dataset.page;
    render();
  }

  if(speech)speak(speech.dataset.speak);

  if(fav){
    const w=words.find(x=>x.id===fav.dataset.fav);
    if(w){
      w.favorite=!w.favorite;
      save();
      render();
    }
  }

  if(result){
    const w=studyList[studyIndex];
    updateWord(w,result.dataset.result==="remember");
    studyIndex++;
    showStudy();
  }

  if(reviewResult){
    const w=studyList[studyIndex];
    updateWord(w,reviewResult.dataset.review==="true");
    studyIndex++;
    if(studyIndex>=studyList.length){
      alert("복습을 완료했습니다!");
      setPage("home");
    }else showReview();
  }
});

applyTheme();
save();
render();
