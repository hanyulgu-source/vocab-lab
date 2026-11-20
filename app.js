
const initialWords = [
  {word:"significant",meaning:"중요한, 상당한",pos:"형용사",syn:"important, meaningful",example:"The discovery was significant."},
  {word:"establish",meaning:"설립하다, 확립하다",pos:"동사",syn:"found, create",example:"They established a new school."},
  {word:"contribute",meaning:"기여하다, 공헌하다",pos:"동사",syn:"help, donate",example:"Exercise contributes to good health."},
  {word:"assume",meaning:"가정하다, 추정하다",pos:"동사",syn:"suppose, presume",example:"We assume that the answer is correct."},
  {word:"occur",meaning:"발생하다, 일어나다",pos:"동사",syn:"happen, take place",example:"The accident occurred yesterday."},
  {word:"require",meaning:"요구하다, 필요로 하다",pos:"동사",syn:"need, demand",example:"This task requires patience."},
  {word:"maintain",meaning:"유지하다, 주장하다",pos:"동사",syn:"preserve, sustain",example:"We should maintain our health."},
  {word:"various",meaning:"다양한",pos:"형용사",syn:"diverse, different",example:"There are various opinions."},
  {word:"environment",meaning:"환경",pos:"명사",syn:"surroundings, setting",example:"We must protect the environment."},
  {word:"essential",meaning:"필수적인, 본질적인",pos:"형용사",syn:"necessary, vital",example:"Water is essential for life."},
  {word:"benefit",meaning:"이익, 혜택 / 이익을 주다",pos:"명사·동사",syn:"advantage, gain",example:"Reading has many benefits."},
  {word:"individual",meaning:"개인, 개인의",pos:"명사·형용사",syn:"person, single",example:"Every individual is different."},
  {word:"approach",meaning:"접근하다 / 접근법",pos:"동사·명사",syn:"method, strategy",example:"We need a new approach."},
  {word:"available",meaning:"이용 가능한, 구할 수 있는",pos:"형용사",syn:"accessible, obtainable",example:"The information is available online."},
  {word:"consider",meaning:"고려하다, 여기다",pos:"동사",syn:"think about, regard",example:"Please consider my suggestion."},
  {word:"affect",meaning:"영향을 미치다",pos:"동사",syn:"influence, impact",example:"Sleep affects your health."},
  {word:"claim",meaning:"주장하다, 요구하다 / 주장",pos:"동사·명사",syn:"assert, argue",example:"He claims that it is true."},
  {word:"evidence",meaning:"증거, 근거",pos:"명사",syn:"proof, support",example:"There is no evidence."},
  {word:"occur",meaning:"발생하다, 떠오르다",pos:"동사",syn:"happen, arise",example:"An idea occurred to me."},
  {word:"respond",meaning:"반응하다, 대답하다",pos:"동사",syn:"reply, react",example:"She responded to the question."}
];

const KEY = "vocabLabData";

let saved = {};
try {
  saved = JSON.parse(localStorage.getItem(KEY) || "{}");
} catch (e) {
  saved = {};
}

let words = [...initialWords, ...(saved.customWords || [])];
let known = saved.known || [];
let wrong = saved.wrong || [];
let index = 0;
let quizIndex = 0;
let quizList = [];
let quizScore = 0;

const main = document.querySelector("main");

function save() {
  localStorage.setItem(KEY, JSON.stringify({
    known, wrong,
    customWords: saved.customWords || [],
    totalCorrect: saved.totalCorrect || 0,
    totalAnswered: saved.totalAnswered || 0
  }));
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function home() {
  main.innerHTML = `
    <section class="welcome">
      <h2>오늘도 영어 어휘를 쌓아 볼까요?</h2>
      <p>나만의 수능 영어 학습 공간</p>
    </section>
    <nav>
      <button data-page="study">📖 단어 학습</button>
      <button data-page="quiz">✏️ 단어 테스트</button>
      <button data-page="wrong">📌 오답 노트</button>
      <button data-page="stats">📊 학습 통계</button>
      <button data-page="add">➕ 단어 추가</button>
    </nav>
    <section class="today">
      <h2>Today's Vocabulary</h2>
      <p>전체 단어 ${words.length}개</p>
      <p>암기 완료 ${known.length}개</p>
      <p>복습할 단어 ${wrong.length}개</p>
      <button data-page="study">학습 시작하기 →</button>
    </section>
  `;
}

function study() {
  const w = words[index % words.length];
  main.innerHTML = `
    <section class="today">
      <p>단어 ${index + 1} / ${words.length}</p>
      <h2 style="font-size:32px">${w.word}</h2>
      <p>${w.pos}</p>
      <button id="speak">🔊 발음 듣기</button>
      <hr>
      <div id="meaning" hidden>
        <h2>${w.meaning}</h2>
        <p>유의어: ${w.syn}</p>
        <p>예문: ${w.example}</p>
        <p>${w.example}</p>
      </div>
      <button id="reveal">뜻 확인하기</button>
      <button id="known">✓ 암기 완료</button>
      <button id="next">다음 단어 →</button>
    </section>
    <button data-page="home">← 홈으로</button>
  `;

  document.getElementById("speak").onclick = () => {
    const utterance = new SpeechSynthesisUtterance(w.word);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  document.getElementById("reveal").onclick = () => {
    document.getElementById("meaning").hidden = false;
  };

  document.getElementById("known").onclick = () => {
    if (!known.includes(w.word)) known.push(w.word);
    wrong = wrong.filter(x => x !== w.word);
    save();
    study();
  };

  document.getElementById("next").onclick = () => {
    index = (index + 1) % words.length;
    study();
  };
}

function startQuiz() {
  quizList = shuffle(words).slice(0, Math.min(10, words.length));
  quizIndex = 0;
  quizScore = 0;
  showQuestion();
}

function showQuestion() {
  if (quizIndex >= quizList.length) {
    saved.totalAnswered = (saved.totalAnswered || 0) + quizList.length;
    saved.totalCorrect = (saved.totalCorrect || 0) + quizScore;
    save();

    main.innerHTML = `
      <section class="today">
        <h2>테스트 완료! 🎉</h2>
        <h1>${quizScore} / ${quizList.length}</h1>
        <p>정답률: ${Math.round(quizScore / quizList.length * 100)}%</p>
        <button id="again">다시 테스트</button>
        <button data-page="home">홈으로</button>
      </section>
    `;
    document.getElementById("again").onclick = startQuiz;
    return;
  }

  const w = quizList[quizIndex];
  const choices = shuffle([
    w.meaning,
    ...shuffle(words.filter(x => x.word !== w.word))
      .slice(0, 3).map(x => x.meaning)
  ]);

  main.innerHTML = `
    <section class="today">
      <p>문제 ${quizIndex + 1} / ${quizList.length}</p>
      <h2>${w.word}</h2>
      <p>올바른 뜻을 선택하세요.</p>
      ${choices.map((c,i) =>
        `<button class="choice" data-answer="${i}">${c}</button>`
      ).join("<br><br>")}
      <p id="feedback"></p>
    </section>
    <button data-page="home">홈으로</button>
  `;

  document.querySelectorAll(".choice").forEach((button, i) => {
    button.onclick = () => {
      const correct = choices[i] === w.meaning;
      document.querySelectorAll(".choice").forEach(b => b.disabled = true);

      if (correct) {
        quizScore++;
        wrong = wrong.filter(x => x !== w.word);
      } else if (!wrong.includes(w.word)) {
        wrong.push(w.word);
      }

      save();
      document.getElementById("feedback").textContent =
        correct ? "정답입니다! 🎉" : "오답입니다. 정답: " + w.meaning;

      const next = document.createElement("button");
      next.textContent = "다음 문제 →";
      next.onclick = () => {
        quizIndex++;
        showQuestion();
      };
      document.getElementById("feedback").after(next);
    };
  });
}

function showWrong() {
  const list = words.filter(w => wrong.includes(w.word));
  main.innerHTML = `
    <section class="today">
      <h2>📌 오답 노트</h2>
      <p>복습할 단어 ${list.length}개</p>
      ${list.length ? list.map(w =>
        `<p><strong>${w.word}</strong> — ${w.meaning}</p>`
      ).join("") : "<p>아직 오답이 없습니다.</p>"}
      <button id="review">오답 복습하기</button>
    </section>
    <button data-page="home">홈으로</button>
  `;

  document.getElementById("review").onclick = () => {
    if (!list.length) return;
    index = words.findIndex(w => w.word === list[0].word);
    study();
  };
}

function stats() {
  const accuracy = saved.totalAnswered
    ? Math.round(saved.totalCorrect / saved.totalAnswered * 100)
    : 0;

  main.innerHTML = `
    <section class="today">
      <h2>📊 학습 통계</h2>
      <p>전체 단어: ${words.length}개</p>
      <p>암기 완료: ${known.length}개</p>
      <p>오답 단어: ${wrong.length}개</p>
      <p>누적 정답률: ${accuracy}%</p>
      <p>테스트 응답 수: ${saved.totalAnswered || 0}개</p>
    </section>
    <button data-page="home">홈으로</button>
  `;
}

function addWord() {
  main.innerHTML = `
    <section class="today">
      <h2>➕ 나만의 단어 추가</h2>
      <input id="newWord" placeholder="영어 단어">
      <input id="newMeaning" placeholder="한국어 뜻">
      <input id="newPos" placeholder="품사">
      <button id="addButton">단어 저장하기</button>
      <p id="message"></p>
    </section>
    <button data-page="home">홈으로</button>
  `;

  document.getElementById("addButton").onclick = () => {
    const word = document.getElementById("newWord").value.trim();
    const meaning = document.getElementById("newMeaning").value.trim();
    const pos = document.getElementById("newPos").value.trim();

    if (!word || !meaning) {
      document.getElementById("message").textContent =
        "영어 단어와 뜻을 입력해 주세요.";
      return;
    }

    if (words.some(w => w.word.toLowerCase() === word.toLowerCase())) {
      document.getElementById("message").textContent =
        "이미 등록된 단어입니다.";
      return;
    }

    const item = {
      word, meaning, pos: pos || "미분류",
      syn: "-", example: "예문을 추가해 보세요."
    };

    saved.customWords = [...(saved.customWords || []), item];
    words.push(item);
    save();
    document.getElementById("message").textContent =
      "단어가 저장되었습니다!";
  };
}

function navigate(page) {
  if (page === "home") home();
  else if (page === "study") study();
  else if (page === "quiz") startQuiz();
  else if (page === "wrong") showWrong();
  else if (page === "stats") stats();
  else if (page === "add") addWord();
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-page]");
  if (button) navigate(button.dataset.page);
});

home();
