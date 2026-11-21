import { TOPICS, LEGACY_TOPICS, filterCatalogTopics, topicForSession } from './content.mjs';
import { getJudgeStatus, startServerSession, getServerSession, postServerSubmission, endServerSession, getLeaderboard, getStreakLeaderboard, getOverallLeaderboard, getPublicProfile, getAccount, registerAccount, loginAccount, logoutAccount, getProgress, recordTheoryRead, saveServerDraft, setCsrfToken, requestEmailVerification, confirmEmailVerification, requestPasswordReset, resetPassword, startCustomTest, getCustomTest, getAdminSubmissions, getAdminSubmission, revokeAdminSubmission, getAdminSubmissionTests, getAdminSubmissionTest, getAdminUsers, getAdminUser, updateAdminUser, resetAdminUserPassword, changeAdminUserEmail, changeAdminUserNickname } from './api-client.mjs';
import { mergeServerSession } from './session-sync.mjs';
import { LANGUAGES, INTERVALS, dayKey, addDays, freshState, migrateState, snapshotSubmission, streakSummary, formatTime } from './core.mjs';
import { applyAccountProgress, accountCacheKey, hasChangedActiveDraft } from './account-state.mjs';
import {captureEmailAction,emailActionScreen,forgotPasswordForm} from './email-ui.mjs';
import {COURSE_LEVELS,TOPIC_READINGS,CURRICULUM_SOURCE} from './learning-resources.mjs';
import {attachEditorGuard} from './editor-input-guard.mjs';
import {attachCodeHighlight} from './editor-view.mjs';
import {createEditorClipboardPanel} from './editor-clipboard-ui.mjs';
import {fairPlayNotice} from './fair-play.mjs';
import {createAdminPanel} from './admin-ui.mjs';
import {createAdminUsersPanel} from './admin-users-ui.mjs';
import {createAdminCompetitionsPanel} from './admin-competitions-ui.mjs';
import {getAdminCompetitions,getAdminCompetition} from './api-client.mjs';
import {createCustomTestRunner} from './custom-test-run.mjs';
import {createRetestController} from './retest-controller.mjs';
import {createDashboardCompetitions} from './dashboard-competitions.mjs';
import {createCompetitionReminders} from './competition-reminders.mjs';
import {captureViewState,restoreViewState,withPreservedView} from './view-state.mjs';
import {postSubmissionRetest,getSubmissionRetest} from './api-client.mjs';
import {createCompetitionsPanel} from './competitions-ui.mjs';
import {createCompetitionBroadcast} from './competition-broadcast.mjs';
import {profileCompetitionHistory} from './profile-competition-history.mjs';
import {getCompetitions,createCompetition,getCompetition,joinCompetition,leaveCompetition,startCompetition,vetoCompetitionTopic,openCompetitionSession,getCompetitionLeaderboard} from './api-client.mjs';
import {recordComparison,trainingRecordModel,advanceRecordNotices,streakTopFiveRows,seriesDays} from './training-record.mjs';

const icons = {
  code: '<path d="m8 5-6 7 6 7m8-14 6 7-6 7m-2-17-4 20"/>',
  home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
  book: '<path d="M12 5C8 2 4 3 2 4v15c3-1 6-1 10 1 4-2 7-2 10-1V4c-3-1-6-1-10 1Zm0 0v15"/>',
  repeat: '<path d="M20 7H7a4 4 0 0 0-4 4m17-4-4-4m4 4-4 4M4 17h13a4 4 0 0 0 4-4M4 17l4-4m-4 4 4 4"/>',
  trophy: '<path d="M8 3h8v7a4 4 0 0 1-8 0Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8"/>',
  duel: '<g stroke-width="1.35"><rect x="3" y="2" width="18" height="7" rx="1.3"/><path d="M5.5 4.5H6m2 0h.5m2 0h.5m2 0h.5m2 0h.5m2 0h.5M8 7h8"/><g transform="rotate(180 12 12)"><rect x="3" y="2" width="18" height="7" rx="1.3"/><path d="M5.5 4.5H6m2 0h.5m2 0h.5m2 0h.5m2 0h.5m2 0h.5M8 7h8"/></g></g>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  shield: '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>',
  flame: '<path d="M13 2c3 6-2 6 1 10 1-2 3-2 3-5 6 8 3 14-5 14C4 21 2 14 6 9c-1 4 3 5 3 2 0-4 4-5 4-9Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6m10-6v6M3 11h18m-13 5h1m6 0h1"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  network: '<circle cx="5" cy="6" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="17" cy="19" r="3"/><circle cx="4" cy="19" r="2"/><path d="m8 6 8-1M6 9l9 8M18 8l-1 8M5 9l-1 8m2 2h8"/>',
  layers: '<path d="m12 2 10 6-10 6L2 8Zm-10 11 10 6 10-6M2 18l10 6 10-6"/>',
  branch: '<circle cx="6" cy="4" r="2"/><circle cx="6" cy="20" r="2"/><circle cx="18" cy="6" r="2"/><path d="M6 6v12m0-4h5a7 7 0 0 0 7-6"/>',
  sort: '<path d="M5 3v18m-3-3 3 3 3-3m3-15h10M11 9h8m-8 6h5m-5 6h2"/>',
  hash: '<path d="m9 3-3 18M18 3l-3 18M3 8h18M2 16h18"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/>',
  close: '<path d="m5 5 14 14M5 19 19 5"/>',
  menu: '<path d="M3 5h18M3 12h18M3 19h18"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Zm0 0L11 13"/>',
  download: '<path d="M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
  logout: '<path d="M9 3H3v18h6m6-15 6 6-6 6m-7-6h13"/>',
};
const icon = name => `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${icons[name] || icons.code}</svg>`;
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
let storageKey = null, storageAvailable = true;
let state = freshState(), legacyState = null;
let account = null, authLoading = true, authMode = 'login', authError = '', legacyAvailable = false, accountGeneration = 0, progressError = '';
const draftConflicts = new Map(), draftRequests = new Map();
let draftTimer, progressRequest=0, editorGuard=null, editorHighlight=null, editorSessionId=null, deferredEditorRender=false;
const customTestRunner=createCustomTestRunner({startRun:startCustomTest,getRun:getCustomTest,notify:message=>toast(message)});
const dashboardCompetitions=createDashboardCompetitions({loadCompetitions:getCompetitions});
const competitionReminders=createCompetitionReminders({loadCompetitions:getCompetitions,root:document.querySelector('#competition-reminder')});
let dashboardCompetitionsBinding=null;
const ownerRetests=createRetestController({postRetest:postSubmissionRetest,getRetest:getSubmissionRetest,
  available:id=>Boolean(account&&route().page==='training'&&state.active?.server&&state.active.submissions.some(s=>s.id===id&&s.confirmed&&(s.status==='unavailable'||ownerRetests.view(id).retest?.state==='pending'))),
  onChange:()=>refreshSubmissions(),
  onPayload:payload=>{if(payload.session&&localSession(payload.session.id))receiveServerResult(payload);},
  onError:error=>toast(error?.message||'Не удалось отправить запрос повторной проверки.'),
});
const editorClipboardPanel=createEditorClipboardPanel();
let editorClipboardBinding=null,editorClipboardKey=null;
let customTestBinding=null, adminBinding=null, adminUsersBinding=null, adminCompetitionsBinding=null, competitionsBinding=null,broadcastBinding=null;
const competitionBroadcast=createCompetitionBroadcast({loadCompetition:async(id,{signal,observer}={})=>{
  if(observer&&account?.isAdmin===true)return getAdminCompetition(id,{signal});
  try{return await getCompetition(id,{signal});}
  catch(error){if(error.status===403&&account?.isAdmin===true)return getAdminCompetition(id,{signal});throw error;}
}});
const competitionsPanel=createCompetitionsPanel({
  listCompetitions:getCompetitions,loadCompetition:getCompetition,
  createCompetition:async settings=>{const generation=accountGeneration,data=await createCompetition(settings);if(generation===accountGeneration)void competitionReminders.refresh();return data;},
  joinCompetition:async(...args)=>{const generation=accountGeneration,data=await joinCompetition(...args);if(generation===accountGeneration)void competitionReminders.refresh();return data;},
  leaveCompetition:async(...args)=>{const generation=accountGeneration,data=await leaveCompetition(...args);if(generation===accountGeneration)competitionReminders.forget(data.competition.id);return data;},
  startCompetition:async(...args)=>{const generation=accountGeneration,data=await startCompetition(...args);if(generation===accountGeneration)void competitionReminders.refresh();return data;},vetoTopic:vetoCompetitionTopic,
  openSession:openCompetitionSession,loadSession:getServerSession,submitCode:postServerSubmission,saveDraft:saveServerDraft,
  startCustomTest,getCustomTest,getAccountId:()=>account?.id,getIsAdmin:()=>account?.isAdmin===true,
  renderTask:session=>'<aside class="card task-panel">'+taskDescription(topicForSession(session))+'</aside>',
  navigate:id=>navigate('competition',id),notify:message=>toast(message),
  onRatingUpdated:()=>{
    leaderboardRequest++;leaderboardState={key:null,loading:false,data:null,error:''};
    invalidateOwnPublicProfile();loadCompetitionTopFive(true);
  },
});
function adminAccessError(error){
  if(error?.status===401&&account){clearAccount();authLoading=false;render();}
  else if(error?.status===403&&account){account={...account,isAdmin:false};adminPanel.clear();adminUsersPanel.clear();adminCompetitionsPanel.clear();render();}
}
const adminPanel=createAdminPanel({
  loadList:getAdminSubmissions,loadDetail:getAdminSubmission,loadTests:getAdminSubmissionTests,loadTest:getAdminSubmissionTest,
  revokeSubmission:revokeAdminSubmission,
  postRetest:postSubmissionRetest,getRetest:getSubmissionRetest,
  onRetested:()=>{
    leaderboardRequest++;leaderboardState={key:null,loading:false,data:null,error:''};
    invalidateOwnPublicProfile();loadTopFive(true);loadStreakTopFive(true);loadCompetitionTopFive(true);
    syncProgress({redraw:false}).catch(error=>toast('Обновите прогресс после восстановления связи. '+error.message));
  },
  onRevoked:()=>{
    leaderboardRequest++;leaderboardState={key:null,loading:false,data:null,error:''};
    invalidateOwnPublicProfile();
    loadTopFive(true);loadStreakTopFive(true);loadCompetitionTopFive(true);
    syncProgress({redraw:false}).catch(error=>toast('Обновите прогресс после восстановления связи. '+error.message));
  },
  onError:adminAccessError,
});
const adminCompetitionsPanel=createAdminCompetitionsPanel({loadList:getAdminCompetitions,loadDetail:getAdminCompetition,onError:adminAccessError});
async function changeAdminLogin(id, operation, notice) {
  const generation = accountGeneration;
  const ownAccount = id === account?.id;
  if (ownAccount) save();
  const result = await operation();
  if (ownAccount && generation === accountGeneration && result.signedOut === true) {
    clearAccount();
    authLoading = false;
    authMode = 'login';
    authError = '';
    render();
    toast(notice);
  }
  return result;
}
const adminUsersPanel=createAdminUsersPanel({
  loadList:getAdminUsers,loadDetail:getAdminUser,
  resetPassword:(id,password)=>changeAdminLogin(id,()=>resetAdminUserPassword(id,password),'Пароль изменён. Войдите с новым паролем.'),
  changeEmail:(id,email)=>changeAdminLogin(id,()=>changeAdminUserEmail(id,email),'Почта изменена. Войдите с новым адресом.'),
  changeNickname:async(id,displayName)=>{
    const generation=accountGeneration,result=await changeAdminUserNickname(id,displayName);
    if(generation===accountGeneration&&result.user?.id===id){
      if(id===account?.id)account={...account,displayName:result.user.displayName};
      leaderboardRequest++;leaderboardState={key:null,loading:false,data:null,error:''};
      invalidateOwnPublicProfile();
      void loadTopFive(true);void loadStreakTopFive(true);void loadCompetitionTopFive(true);
    }
    return result;
  },
  updateUser:async(id,values)=>{
  const generation=accountGeneration,result=await updateAdminUser(id,values);
  if(generation===accountGeneration&&result.user?.id===account?.id)account={...account,firstName:result.user.firstName,lastName:result.user.lastName};
  if(generation===accountGeneration&&result.user?.id===id&&publicUserState.id===id)invalidateOwnPublicProfile();
  return result;
},onError:adminAccessError});
let mailStatus={ready:false,message:'Владелец сайта ещё не подключил отправку писем.'}, emailAction=captureEmailAction(location,history), renderedEmailAction=null;
try {
  legacyState = migrateState(JSON.parse(localStorage.getItem('algopraktika.prototype.v1') || 'null'));
} catch { storageAvailable = false; }
const recentAccepted = [state.active,...state.attempts].filter(s=>s?.server&&s.best!==null&&s.submissions.some(x=>x.confirmed&&x.status==='accepted')).sort((a,b)=>b.startedAt-a.startedAt)[0];
let category = 'Все темы', query = '', level = 'Все уровни', studyStatus = 'all', rankingType = 'overall', rankingScope = 'all', rankingLanguage = 'all', streakSort = 'series', rankingTopic = recentAccepted?.topic || 'dijkstra';
let leaderboardState = {key:null,loading:false,data:null,error:''}, leaderboardRequest=0;
let topFiveState={data:null,loading:false,error:'',loadedAt:0}, topFiveRefreshAgain=false;
let publicUserState={id:null,data:null,loading:false,error:'',status:null,loadedAt:0}, publicUserRequest=0;
let streakTopFiveState={data:null,loading:false,error:'',loadedAt:0}, streakTopFiveRefreshAgain=false;
let competitionTopFiveState={data:null,loading:false,error:'',loadedAt:0}, competitionTopFiveRefreshAgain=false;
let recordNoticeState={seen:[],bestByTopic:{}}, recordNoticesPrimed=false;
const openCourseLevels=new Set();
let menuOpen = false, toastTimeout, focusReturn = null;
let judgeStatus = {ready:false, message:'Проверяем доступность исполнителя…', languages:[]};
let clockOffset = 0, startRequestId = null, startingSession = false;
const pollingSessions = new Set();
const app = document.querySelector('#app'), modal = document.querySelector('#modal');
let renderedViewKey = null;
function replaceViewHTML(element, contents) {
  if(element && element.innerHTML !== contents)withPreservedView(app,()=>{element.innerHTML=contents;});
}
function save() {
  if(!account || !storageKey)return;
  try { localStorage.setItem(storageKey, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; toast('Не удалось сохранить резервную копию черновика в браузере. Проверьте связь с сервером.'); }
}
function toast(message) {
  const box = document.querySelector('#toast'); box.textContent = message; box.classList.add('show');
  clearTimeout(toastTimeout); toastTimeout = setTimeout(() => box.classList.remove('show'), 5200);
}
function observePersonalRecords({prime=false}={}) {
  if(!account)return false;
  const next=advanceRecordNotices(recordNoticeState,[state.active,...state.attempts],{prime:prime||!recordNoticesPrimed});
  recordNoticeState=next.state;recordNoticesPrimed=true;
  try{localStorage.setItem('algopraktika.record-notices.v1:'+account.id,JSON.stringify(recordNoticeState.seen));}catch{}
  if(next.events.length)toast(next.events.map(event=>{const title=topicForSession(localSession(event.sessionId))?.title;return (title?'«'+title+'»: ':'')+event.message;}).join(' '));
  return next.events.length>0;
}
const topicById = id => TOPICS.find(t => t.id === id);
const languageById = id => LANGUAGES.find(l => l.id === id) || LANGUAGES[0];
const today = () => dayKey(Date.now()+clockOffset);
const dueTopics = () => TOPICS.filter(t => state.reviews[t.id]?.due <= today());
const upcomingTopics = () => TOPICS.filter(t => state.reviews[t.id]).sort((a, b) => state.reviews[a.id].due.localeCompare(state.reviews[b.id].due));
const dateLabel = key => new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long' }).format(new Date(`${key}T12:00:00Z`));
const relativeDate = key => key < today() ? `Просрочено · ${dateLabel(key)}` : key === today() ? 'Сегодня' : key === addDays(today(), 1) ? 'Завтра' : dateLabel(key);
function languageOptions(topic, selected) {
  const languages = LANGUAGES.filter(language => !topic?.allowedLanguages || topic.allowedLanguages.includes(language.id));
  const current = selected ?? languages.find(language => language.priority !== 'next')?.id;
  return languages.map(language => `<option value="${language.id}" ${language.id === current ? 'selected' : ''} ${language.priority === 'next' ? 'disabled' : ''}>${language.name}${language.priority === 'next' ? ' · позже' : ''}</option>`).join('');
}
const topicSymbol = t => `<div class="topic-symbol ${t.color}">${icon(t.icon)}</div>`;
function route() { const [, page = 'dashboard', id] = location.hash.split('/'); return { page:page==='profile'?'dashboard':page, id }; }
function navigate(page, id) {
  if(page==='profile')page='dashboard';
  const next = `#/${page}${id ? `/${id}` : ''}`;
  menuOpen = false;
  if (location.hash === next) render(); else location.hash = next;
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function openDialog(content) {
  focusReturn = document.activeElement;
  if (modal.open) modal.close();
  modal.innerHTML = `<button class="modal-close" data-action="close-dialog" aria-label="Закрыть">${icon('close')}</button>${content}`;
  modal.showModal();
}
function closeDialog() { startRequestId = null; modal.close(); focusReturn?.isConnected && focusReturn.focus({preventScroll:true}); }
modal.addEventListener('cancel',()=>{startRequestId=null;});
modal.addEventListener('click', event => { if (event.target === modal) { const r = modal.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); } });
function ownIdentityFields(prefix){
  return `<div class="profile-identity"><div class="field"><label for="${prefix}-last-name">Фамилия</label><input id="${prefix}-last-name" readonly aria-readonly="true" value="${escapeHTML(account.lastName)}" placeholder="Не указано"></div><div class="field"><label for="${prefix}-first-name">Имя</label><input id="${prefix}-first-name" readonly aria-readonly="true" value="${escapeHTML(account.firstName)}" placeholder="Не указано"></div><p class="rank-note">Никнейм, имя и фамилию может изменить только администратор. Если нужно исправить или добавить данные, обратитесь к администратору. В профиле отображаются фамилия, имя и никнейм; в рейтингах — никнейм.</p></div>`;
}
function authScreen() {
  document.title='Вход — AlgoGym';
  if(authLoading)return `<main class="auth-layout" id="main"><section class="card auth-card" role="status">${icon('clock')}<h1>Загружаем ваш кабинет…</h1></section></main>`;
  const signup=authMode==='register';
  return `<main class="auth-layout" id="main"><section class="auth-intro"><div class="auth-brand"><span class="brand-mark">${icon('code')}</span><span class="brand-name">Algo<span>Gym</span></span></div><h1>Тренажёр алгоритмов</h1><p>Изучайте теорию, пишите решение по памяти и возвращайтесь к теме вовремя.</p><div class="auth-features"><span>${icon('code')} C++ и Python · настоящие тесты</span><span>${icon('repeat')} Повторения по расписанию</span><span>${icon('trophy')} Личные рекорды и рейтинги</span></div></section><section class="card auth-card"><div class="segmented auth-tabs"><button type="button" class="${!signup?'active':''}" data-action="auth-mode" data-value="login">Вход</button><button type="button" class="${signup?'active':''}" data-action="auth-mode" data-value="register">Регистрация</button></div><h2>${signup?'Регистрация':'Вход'}</h2><p class="auth-subtitle">${signup?'Создайте аккаунт — прогресс будет доступен на любом устройстве.':'Войдите, чтобы продолжить с того же места.'}</p><form id="auth-form" method="post">${signup?'<div class="field"><label for="auth-last-name">Фамилия</label><input id="auth-last-name" name="lastName" autocomplete="family-name" required maxlength="60" placeholder="Ваша фамилия"></div><div class="field"><label for="auth-first-name">Имя</label><input id="auth-first-name" name="firstName" autocomplete="given-name" required maxlength="60" placeholder="Ваше имя"><small>Имя и фамилию может изменить только администратор. Они видны вошедшим пользователям в вашем профиле.</small></div><div class="field"><label for="auth-name">Никнейм в профиле и рейтингах</label><input id="auth-name" name="displayName" autocomplete="nickname" required minlength="2" maxlength="30" placeholder="Ваш никнейм"><small>Никнейм должен быть уникальным. После регистрации его может изменить только администратор. В профиле отображаются фамилия, имя и никнейм; в рейтингах — никнейм.</small></div>':''}<div class="field"><label for="auth-email">Почта (логин)</label><input id="auth-email" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.ru"></div><div class="field"><label for="auth-password">Пароль</label><input id="auth-password" name="password" type="password" autocomplete="${signup?'new-password':'current-password'}" required ${signup?'minlength="4"':''} maxlength="72">${signup?'<small>От 4 символов. Для длинного пароля с кириллицей может действовать меньший предел — форма подскажет.</small>':''}</div>${signup?'<div class="field"><label for="auth-repeat">Повторите пароль</label><input id="auth-repeat" name="repeat" type="password" autocomplete="new-password" required maxlength="72"></div>':''}${signup&&legacyAvailable?'<label class="auth-check"><input type="checkbox" name="linkLegacy" '+(legacyState?.profile?'checked':'')+'><span>Связать результаты прежнего прототипа с этим аккаунтом. Используется ваш текущий подтверждённый вход ChatGPT.</span></label>':''}<p class="form-error" id="auth-error" role="alert">${escapeHTML(authError)}</p><button class="button primary auth-submit" type="submit">${signup?'Создать аккаунт':'Войти'} ${icon('arrow')}</button></form>${!signup?'<button class="text-link forgot-link" type="button" data-action="forgot-password">Забыли пароль?</button>':''}<p class="auth-footnote">${mailStatus.ready?'После регистрации придёт письмо для подтверждения почты. Если забудете пароль, сможете восстановить его по письму.':'Отправка писем ещё не подключена. Подтверждение почты и восстановление пароля временно недоступны.'}</p></section></main>`;
}
function clearAccount() {
  competitionReminders.clear();
  dashboardCompetitions.clear();dashboardCompetitionsBinding?.();dashboardCompetitionsBinding=null;
  ownerRetests.clear();
  competitionsPanel.clear();competitionsBinding?.();competitionsBinding=null;
  competitionBroadcast.clear();broadcastBinding?.();broadcastBinding=null;
  adminPanel.clear();adminBinding?.();adminBinding=null;
  adminUsersPanel.clear();adminUsersBinding?.();adminUsersBinding=null;
  adminCompetitionsPanel.clear();adminCompetitionsBinding?.();adminCompetitionsBinding=null;
  studyStatus='all';
  publicUserRequest++;publicUserState={id:null,data:null,loading:false,error:'',status:null,loadedAt:0};
  customTestRunner.reset();customTestBinding?.();customTestBinding=null;
  editorClipboardBinding?.();editorClipboardBinding=null;editorClipboardPanel.clear();editorClipboardKey=null;
  accountGeneration++;account=null;state=freshState();storageKey=null;setCsrfToken(null);draftConflicts.clear();clearTimeout(draftTimer);
  leaderboardRequest++;leaderboardState={key:null,loading:false,data:null,error:''};progressError='';
  topFiveState={data:null,loading:false,error:'',loadedAt:0};topFiveRefreshAgain=false;
  streakTopFiveState={data:null,loading:false,error:'',loadedAt:0};streakTopFiveRefreshAgain=false;
  competitionTopFiveState={data:null,loading:false,error:'',loadedAt:0};competitionTopFiveRefreshAgain=false;
  recordNoticeState={seen:[],bestByTopic:{}};recordNoticesPrimed=false;
  if(modal.open)closeDialog();
}
async function syncProgress({cache=null,redraw=true}={}) {
  const generation=accountGeneration, request=++progressRequest;
  const data=await getProgress();
  if(generation!==accountGeneration||!account||request!==progressRequest)return;
  const previous=cache?.active ? cache : state;
  const applied=applyAccountProgress(account,data,previous,{liveState:cache===null&&!authLoading?state:null});
  state=applied.state;progressError='';
  if(data.serverNow)clockOffset=data.serverNow-Date.now();
  if(applied.conflict)draftConflicts.set(state.active.id,applied.conflict);
  else if(state.active)draftConflicts.delete(state.active.id);
  save();
  observePersonalRecords({prime:authLoading});
  // The admin panels manage their own forms. A background progress refresh
  // must not replace a password field or interrupt its pending request.
  if(!competitionsBinding&&!adminUsersBinding&&(redraw||applied.conflict||previous.active?.id!==state.active?.id||previous.active?.code!==state.active?.code||(Number.isFinite(previous.active?.best)&&state.active?.best===null)))render();
  else refreshTrainingMetadata();
  if(state.active?.draftDirty&&!draftConflicts.has(state.active.id))scheduleDraft();
}
async function useAccount(result,{linked=false}={}) {
  clearAccount();account=result.user;if(result.mail)mailStatus=result.mail;setCsrfToken(result.csrfToken);storageKey=accountCacheKey(account.id);
  try{const seen=JSON.parse(localStorage.getItem('algopraktika.record-notices.v1:'+account.id)||'[]');if(Array.isArray(seen))recordNoticeState.seen=seen.filter(key=>typeof key==='string').slice(-512);}catch{}
  const generation=accountGeneration;
  let cache=null;try{cache=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
  if(linked&&legacyState){cache=structuredClone(legacyState);if(cache.active?.code)cache.active={...cache.active,draftDirty:true,draftRevision:0};}
  authLoading=true;render();
  try{
    await syncProgress({cache,redraw:false});
    if(generation!==accountGeneration)return;
    if(linked&&legacyState) {
      for(const topic of Object.keys(legacyState.theoryRead).filter(id=>topicById(id)&&!state.theoryRead[id])){if(generation!==accountGeneration)return;await recordTheoryRead(topic);}
      if(generation!==accountGeneration)return;
      await syncProgress({redraw:false});
    }
    if(generation!==accountGeneration)return;
    competitionReminders.start(account.id);connectJudge();
  }catch(error){if(generation===accountGeneration)progressError=error.message;}
  finally{if(generation===accountGeneration){authLoading=false;render();}}
}
async function bootstrapAccount() {
  try {const result=await getAccount();if(result.mail)mailStatus=result.mail;legacyAvailable=result.legacyAvailable;if(result.user)await useAccount(result);}
  catch(error){authError=error.message;}
  finally{authLoading=false;render();}
}
async function markRead(topic) {
  const generation=accountGeneration;
  try{await recordTheoryRead(topic);if(generation!==accountGeneration)return;await syncProgress();trainingDialog(topic);}
  catch(error){toast(error.message);}
}
function scheduleDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(()=>flushDraft().catch(error=>toast(error.message)),700);}
async function flushDraft() {
  if(editorGuard)editorGuard.reconcile();
  const session=state.active;if(!account||!session?.server||!session.draftDirty)return;
  const generation=accountGeneration;
  if(draftConflicts.has(session.id))throw new Error('Выберите версию черновика перед продолжением.');
  const existing=draftRequests.get(session.id);
  if(existing){await existing;if(generation===accountGeneration)return flushDraft();return;}
  const work=writeDraft(session);draftRequests.set(session.id,work);
  try{await work;}finally{draftRequests.delete(session.id);}
  if(generation===accountGeneration&&state.active?.id===session.id&&state.active.draftDirty)return flushDraft();
}
async function writeDraft(session) {
  const generation=accountGeneration,id=session.id,code=session.code,revision=session.draftRevision??0;
  try {
    const result=await saveServerDraft(id,code,revision);
    if(generation!==accountGeneration)return;
    const current=localSession(id);if(!current)return;
    current.draftRevision=result.session.draftRevision;current.draftDirty=current.code!==code;save();updateDraftLabel();
  }catch(error){
    if(generation!==accountGeneration)return;
    if(error.status===409&&error.data?.session){draftConflicts.set(id,error.data.session);if(route().page==='training')render();throw new Error('Черновик изменён на другом устройстве. Выберите версию.');}
    updateDraftLabel('Нет связи · черновик сохранён в браузере');
    clearTimeout(draftTimer);draftTimer=setTimeout(()=>flushDraft().catch(()=>{}),5000);throw error;
  }
}
function updateDraftLabel(message) {
  const label=document.querySelector('#character-count');if(label&&state.active)label.textContent=message||`${state.active.code.length} символов · ${state.active.draftDirty?'сохраняем черновик…':'черновик на сервере'}`;
}
function trainingDialog(topicId) {
  if (!account) return;
  const archived = LEGACY_TOPICS.find(t => t.id === topicId);
  const t = topicById(archived?.replacementTopic || topicId); if (!t) return;
  startRequestId = crypto.randomUUID();
  openDialog(`<div class="dialog-symbol">${icon('clock')}</div><h2 id="modal-title">${t.title}. По памяти.</h2><p>После старта откроется пустой редактор и начнётся отсчёт времени.</p><ul class="dialog-points"><li>${icon('lock')}<span>Внешняя вставка и перетаскивание отключены. Свой код можно копировать и перемещать через внутренний буфер редактора.</span></li><li>${icon('clock')}<span>Таймер идёт, даже если перейти в другой раздел или обновить страницу.</span></li><li>${icon('send')}<span>Можно отправлять разные версии кода, пока предыдущие проверяются.</span></li></ul><div class="field"><label for="start-language">Язык программирования</label><select id="start-language">${languageOptions(t)}</select><small>C, Pascal и Кумир предусмотрены для будущего подключения.</small></div><div class="notice">${icon('info')}<span>Код будет запущен на тестах в изолированной среде с ограничениями времени и памяти. Время написания фиксирует сервер; ожидание проверки в результат не входит.</span></div>${state.active ? '<p class="form-error">У вас уже есть тренировка. Новый старт завершит её; отправки останутся в истории.</p>' : ''}${fairPlayNotice()}<div class="dialog-actions"><button class="button outline" data-action="close-dialog">Не сейчас</button><button class="button primary" data-action="confirm-start" data-id="${t.id}">Начать тренировку ${icon('play')}</button></div>`);
}
function archiveActive() {
  if (!state.active) return;
  if (state.active.server) endServerSession(state.active.id).catch(()=>{});
  state.attempts.unshift({ ...state.active, endedAt: Date.now() });
  state.attempts = state.attempts.slice(0, 50);
  state.active = null;
}
async function startTraining(topic, language) {
  if (startingSession) return;
  const generation=accountGeneration;
  const requestId = startRequestId || crypto.randomUUID();
  startRequestId = requestId;
  const button = modal.querySelector('[data-action="confirm-start"], [data-action="confirm-language"]');
  startingSession = true;
  if (button) { button.disabled = true; button.textContent = 'Запускаем…'; }
  try {
    if(state.active&&draftConflicts.has(state.active.id))throw new Error('Сначала выберите версию текущего черновика.');
    await flushDraft();
    if (!judgeStatus.ready) judgeStatus = await getJudgeStatus();
    if (generation!==accountGeneration||!modal.open || startRequestId !== requestId) return;
    if (!judgeStatus.ready) throw new Error(judgeStatus.message || 'Проверка временно недоступна. Попробуйте позже.');
    const result = await startServerSession(topic, language, requestId);
    if(generation!==accountGeneration)return;
    // A progress response prepared before this creation cannot choose the active session anymore.
    progressRequest++;
    if (!modal.open || startRequestId !== requestId) {endServerSession(result.session.id).catch(()=>{});return;}
    clockOffset = result.serverNow - Date.now();
    archiveActive();
    state.active = { ...result.session, server:true, code:'', completed:false, draftDirty:false };
    observePersonalRecords();
    save(); if (modal.open) closeDialog(); navigate('training');
  } catch(error) { toast(error.message); }
  finally { startingSession = false; if (button?.isConnected) {button.disabled=false;button.textContent='Начать тренировку';} }
}
function topicCard(t) {
  const learned = Boolean(state.learned[t.id]);
  const needsFirst = Boolean(state.theoryRead[t.id]) && !learned;
  return `<article class="topic-card${learned ? ' is-learned' : ''}"><div class="topic-card-top">${topicSymbol(t)}<span class="badge ${learned ? 'learned' : ''}">${learned ? `${icon('check')} Изучено` : needsFirst ? 'Нужна первая реализация' : t.level}</span></div><h3>${t.title}</h3><p class="topic-description">${t.summary}</p><div class="topic-meta"><span>${icon('clock')} ${t.minutes} мин теории</span><span class="mono">${t.complexity}</span></div><div class="topic-actions"><button class="button outline" data-action="study" data-id="${t.id}">${icon('book')} Изучить</button><button class="button secondary" data-action="train" data-id="${t.id}">${icon('play')} Тренировать</button></div></article>`;
}
function empty(iconName, title, description, button = '') {
  return `<div class="empty-state"><div class="empty-icon">${icon(iconName)}</div><h3>${title}</h3><p>${description}</p>${button}</div>`;
}
function streakCard() {
  const summary = state.streak || streakSummary(state.activities,today());
  const weekday = (new Date(`${today()}T12:00:00Z`).getUTCDay() + 6) % 7;
  const monday = addDays(today(), -weekday);
  return `<section class="card"><div class="card-title"><h2>Ритм занятий</h2>${icon('flame')}</div><div class="streak-summary"><div class="flame">${icon('flame')}</div><div><div class="streak-number">${summary.current}<span>дней подряд</span></div><div class="streak-sub">Выполненные дни</div></div></div><div class="week">${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, i) => { const key = addDays(monday, i); return `<div class="week-item"><span class="week-label">${day}</span><span class="week-day ${key === today() ? 'today' : ''} ${state.activities.includes(key) ? 'done' : ''} ${summary.protected.includes(key) ? 'protected' : ''}" title="${dateLabel(key)}">${state.activities.includes(key) ? '✓' : Number(key.slice(-2))}</span></div>`; }).join('')}</div><div class="shield-note">${icon('shield')}<span>Защита от пропуска: ${summary.shields}<br>+1 за каждые 7 выполненных дней</span></div></section>`;
}
function upcomingCard() {
  const topics = upcomingTopics().slice(0, 3);
  return `<section class="card"><div class="card-title"><div class="small-heading">${icon('repeat')}<h2>Следующее повторение</h2></div></div>${topics.length ? `<div class="repeat-list">${topics.map(t => `<button class="repeat-row" style="width:100%;text-align:left" data-action="nav" data-page="reviews">${topicSymbol(t)}<span class="repeat-info"><b>${t.title}</b><small>${relativeDate(state.reviews[t.id].due)}</small></span>${icon('chevron')}</button>`).join('')}</div>` : '<p class="tiny-empty">Напишите первую правильную реализацию — и здесь появится расписание повторений.</p>'}<div class="interval-note"><span class="eyebrow" style="font-size:8px;letter-spacing:1px">Чтобы помнить надолго</span><div class="interval-dots">${INTERVALS.map(d => `<span><i></i>${d} дн.</span>`).join('')}</div><p>Каждое успешное повторение увеличивает интервал.</p></div></section>`;
}
function intro(title, subtitle, action = '') { return `<div class="page-intro"><div><h1>${title}</h1>${subtitle?'<p>'+subtitle+'</p>':''}</div>${action}</div>`; }
function dashboard() {
  const nextTopics = filterCatalogTopics({ studyStatus: 'unlearned', learned: state.learned }).slice(0, 4);
  const suggestions = nextTopics.length
    ? `<div class="topic-grid">${nextTopics.map(topicCard).join('')}</div>`
    : `<div class="card">${empty('check', 'Все темы решены', 'Продолжайте практику в разделе повторений.', '<button class="button secondary" data-action="nav" data-page="reviews">К повторениям</button>')}</div>`;
  const learned = Object.keys(state.learned).length;
  const due = dueTopics(), attempts = state.attempts.length + Number(Boolean(state.active));
  
  const fullName=userFullName(account), identity=fullName?`<p class="cabinet-identity">${escapeHTML(fullName)}</p>`:'';
  const overview = `${intro('Мой кабинет', '', `<button class="button outline" data-action="nav" data-page="catalog">Все темы ${icon('arrow')}</button>`)}${identity}<div class="home-grid"><div class="main-column"><div class="stat-grid"><div class="stat-card"><div class="stat-top">${icon('book')} Изученные темы</div><div class="stat-value">${learned}<small> / ${TOPICS.length}</small></div></div><div class="stat-card"><div class="stat-top">${icon('repeat')} Повторить сегодня</div><div class="stat-value">${due.length}<small> тем</small></div></div><div class="stat-card"><div class="stat-top">${icon('code')} Тренировки</div><div class="stat-value">${attempts}</div></div></div><section class="card dashboard-competitions" id="dashboard-competitions" aria-labelledby="dashboard-competitions-title">${dashboardCompetitions.render()}</section><section><div class="section-heading"><div><h2>Следующие темы</h2>${nextTopics.length ? '<p>Нерешённые темы по возрастанию сложности.</p>' : ''}</div><button class="text-link" data-action="nav" data-page="catalog">Все темы ${icon('chevron')}</button></div>${suggestions}</section></div><aside class="right-column">${streakCard()}${upcomingCard()}</aside></div>`;
  return overview+`<section class="cabinet-account-settings" aria-labelledby="account-settings-title"><div class="section-heading"><div><h2 id="account-settings-title">Аккаунт и настройки</h2><p>Личные данные, почта и история тренировок.</p></div></div>${accountSettings()}</section>`;
}
function filteredTopics() { return filterCatalogTopics({category,level,query,studyStatus,learned:state.learned}); }
function catalog() {
  return `<div class="catalog">${intro('Темы', 'Теория Algorithmica, тематические задачи и практика по памяти.', '<button class="button outline" data-action="show-curriculum">Учебный план '+icon('book')+'</button>')}<div class="search-row"><div class="search-box">${icon('search')}<input id="topic-search" aria-label="Поиск темы" type="search" placeholder="Найти алгоритм или тему…" value="${escapeHTML(query)}"></div><select id="level-filter" aria-label="Уровень сложности">${['Все уровни', 'Начальный', 'Средний', 'Продвинутый'].map(l => `<option ${level === l ? 'selected' : ''}>${l}</option>`).join('')}</select><span class="count-label" id="topic-count">Тем: ${filteredTopics().length}</span></div><div class="catalog-study-filter"><span>Статус изучения</span><div class="segmented" role="group" aria-label="Статус изучения тем">${[["all","Все"],["learned","Изученные"],["unlearned","Неизученные"]].map(([value,label])=>`<button type="button" class="${studyStatus===value?"active":""}" data-action="study-status" data-value="${value}" aria-pressed="${studyStatus===value}">${label}</button>`).join("")}</div></div><div class="filter-tabs" role="group" aria-label="Категории тем">${['Все темы', ...new Set(TOPICS.map(t=>t.category))].map(c => `<button class="filter-tab ${category === c ? 'active' : ''}" data-action="category" data-category="${c}" aria-pressed="${category === c}">${c}</button>`).join('')}</div><div class="topic-grid" id="catalog-results">${catalogResults()}</div>${curriculum()}</div>`;
}
function catalogResults() { const topics = filteredTopics(); return topics.length ? topics.map(topicCard).join('') : `<div class="no-results">${empty('search', 'Пока ничего не нашли', 'Измените название, категорию или статус изучения.', '<button class="button outline" data-action="reset-search">Сбросить поиск</button>')}</div>`; }
function updateCatalogResults() { replaceViewHTML(document.querySelector('#catalog-results'),catalogResults()); document.querySelector('#topic-count').textContent = `Тем: ${filteredTopics().length}`; }
function externalLink(title,url,className='') {
  try{if(!['https:','http:'].includes(new URL(url).protocol))return '';}catch{return '';}
  return '<a class="'+className+'" href="'+escapeHTML(url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(title)+' ↗</a>';
}
function curriculumTopicIds(item) { return item.topicIds || (item.topicId ? [item.topicId] : []); }
function curriculumTrainerLinks(item) {
  const topics=curriculumTopicIds(item).map(id=>TOPICS.find(t=>t.id===id)).filter(Boolean);
  return topics.length ? topics.map(t=>'<button class="button secondary" data-action="study" data-id="'+escapeHTML(t.id)+'">'+escapeHTML(t.title)+'</button>').join('') : '<span class="badge">Материалы</span>';
}
function curriculumItemFor(topic) {
  for(const level of COURSE_LEVELS)for(const section of level.sections){const item=section.items.find(item=>curriculumTopicIds(item).includes(topic));if(item)return {item,level};}
  return null;
}
function curriculum() {
  const total=COURSE_LEVELS.reduce((sum,l)=>sum+l.sections.reduce((n,g)=>n+g.items.length,0),0);
  return '<section class="curriculum" id="curriculum"><div class="section-heading"><div><h2>Учебный план</h2><p>'+total+' тем в трёх уровнях · Готовых тренажёров на сайте: '+TOPICS.length+'</p></div></div><p class="curriculum-intro">Порядок тем и внешние подборки взяты из '+externalLink('таблицы подготовки',CURRICULUM_SOURCE.url)+'. Дополнительные темы AlgoGym отмечены отдельно. Для готовых тем можно открыть наш тренажёр; у остальных доступны материалы для самостоятельного изучения. Зачёт и повторения за внешние задания пока не начисляются.</p>'+COURSE_LEVELS.map(level=>'<details class="card curriculum-level" data-level-id="'+level.id+'" '+(openCourseLevels.has(level.id)?'open':'')+'><summary><span><b>'+level.title+'</b><small>'+level.description+'</small></span><span class="badge">Тем: '+level.sections.reduce((n,g)=>n+g.items.length,0)+'</span>'+icon('chevron')+'</summary><div class="curriculum-content">'+level.sections.map(group=>'<section class="curriculum-group"><h3>'+escapeHTML(group.title)+'</h3>'+group.items.map(item=>'<article class="curriculum-item"><div><b>'+escapeHTML(item.title)+'</b>'+(item.practiceNote?'<small>Задачи из таблицы: '+escapeHTML(item.practiceNote)+'</small>':'')+(item.note?'<small>'+escapeHTML(item.note)+'</small>':'')+'</div><div class="curriculum-links">'+curriculumTrainerLinks(item)+item.reading.map((url,i)=>externalLink((/youtu/.test(url)?'Видео':'Теория')+(item.reading.length>1?' '+(i+1):''),url,'text-link')).join('')+item.practice.map((url,i)=>externalLink('Задачи'+(item.practice.length>1?' '+(i+1):''),url,'text-link')).join('')+externalLink(item.supplemental?'Источник темы':'Строка в плане',item.sourceUrl,'curriculum-source')+'</div></article>').join('')+'</section>').join('')+'<p class="rank-note">Источник уровня: '+externalLink(level.title,level.sourceUrl)+'</p></div></details>').join('')+'</section>';
}
function lessonSources(t) {
  const sources=[...(TOPIC_READINGS[t.id]||[]),...(t.sources||[])].filter((s,i,a)=>a.findIndex(x=>x.url===s.url)===i),matched=curriculumItemFor(t.id);
  const readings=(matched?.item.reading??[]).filter(url=>!sources.some(source=>source.url===url));
  const practice=matched?.item.practice??[];
  const isAlgorithmica=url=>/^https:\/\/(?:ru\.)?algorithmica\.org\//.test(url);
  const links=[...sources,...readings.map((url,index)=>({ title:'Материал из учебного плана'+(readings.length>1?' '+(index+1):''),url }))];
  links.sort((a,b)=>Number(isAlgorithmica(b.url))-Number(isAlgorithmica(a.url)));
  if(!links.length&&!practice.length&&!matched)return '';
  const articles=links.length?'<ul>'+links.map(({title,url})=>'<li>'+externalLink(title,url)+'</li>').join('')+'</ul>':'';
  const exercises=practice.length?'<div class="reading-practice"><b>Дополнительные задачи</b>'+practice.map((url,index)=>externalLink('Подборка задач'+(practice.length>1?' '+(index+1):''),url,'button outline')).join('')+'</div>':'';
  const credit=links.some(({url})=>isAlgorithmica(url))?'Статьи «Алгоритмики» распространяются под '+externalLink('CC BY-SA','https://creativecommons.org/licenses/by-sa/4.0/deed.ru')+'.':'';
  const curriculum=matched?(matched.item.supplemental?'Дополнительная тема AlgoGym.':externalLink(matched.level.title,matched.item.sourceUrl)+' по учебному плану.'):'';
  return '<section class="reading-list"><h2>Материалы для изучения</h2>'+articles+exercises+(credit||curriculum?'<p class="reading-credit">'+[credit,curriculum].filter(Boolean).join(' ')+'</p>':'')+'</section>';
}
function examples(t) {
  const cases = [{ title: t.exampleTitle, input: t.exampleIn, output: t.exampleOut }, ...(t.additionalExamples ?? [])];
  return cases.map(({ title, input, output }) => {
    const grid = `<div class="example-grid"><div class="example-box"><div class="example-label">Ввод</div><pre>${escapeHTML(input)}</pre></div><div class="example-box"><div class="example-label">Вывод</div><pre>${escapeHTML(output)}</pre></div></div>`;
    return title ? `<figure class="example-case"><figcaption>${escapeHTML(title)}</figcaption>${grid}</figure>` : grid;
  }).join('');
}
function sourcePolicyNotice(t) {
  return t.restrictions ? `<div class="notice purple source-policy-notice">${icon('shield')}<span><b>Ограничение задачи.</b> ${escapeHTML(t.restrictions)}<br><small>${t.sourcePolicy ? 'Правила использования функций и обязательного синтаксиса проверяются сервером перед запуском на тестах.' : 'Тесты проверяют ответы и ограничения ресурсов. Реализуйте указанный алгоритм самостоятельно.'}</small></span></div>` : '';
}
function runtimeLimitsNotice(t) { return t.runtimeLimits ? `<div class="notice neutral">${icon('clock')}<span>${escapeHTML(t.runtimeLimits)}</span></div>` : ''; }
function lesson(t) {
  if (!t) return missing();
  return `<button class="back-link" data-action="nav" data-page="catalog">${icon('back')} К библиотеке</button><div class="lesson-tag-row"><span class="badge">${t.category}</span><span class="badge">${t.level}</span><span class="badge">${t.minutes} мин</span></div>${intro(t.title, t.summary)}<div class="lesson-grid"><article class="card lesson">${lessonSources(t)}<div class="lesson-intro"><h2>${t.kind==='syntax'?'Что тренируем':'Идея алгоритма'}</h2><p>${escapeHTML(t.introduction)}</p></div><h2>Как это работает</h2><ol>${t.steps.map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ol><div class="lesson-summary"><b>Временная сложность:</b> <span class="mono">${t.complexity}</span>.<br>Оценка относится к алгоритму, а время в рейтинге будет измерять написание кода.</div><h2>На что обратить внимание</h2><ul>${t.pitfalls.map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ul><h2>Задача для тренировки</h2><p>${escapeHTML(t.task)}</p>${sourcePolicyNotice(t)}${runtimeLimitsNotice(t)}<h2>Формат входных данных</h2><p>${escapeHTML(t.input)}</p><h2>Формат выходных данных</h2><p>${escapeHTML(t.output)}</p>${examples(t)}<h2>Проверьте себя</h2><p>Можете объяснить идею без подсказки? Закройте теорию и попробуйте написать решение самостоятельно. Если не получилось, вернитесь к сложному месту и повторите попытку.</p></article><aside class="card lesson-side">${topicSymbol(t)}<h3>От понимания к навыку</h3><p>После теории сразу напишите первую реализацию. Тема станет изученной и попадёт в повторения только после прохождения всех тестов.</p><button class="button ${state.theoryRead[t.id] ? 'outline' : 'secondary'}" data-action="theory-read" data-id="${t.id}" ${state.theoryRead[t.id] ? 'disabled' : ''}>${icon('check')} ${state.theoryRead[t.id] ? 'Теория прочитана' : 'Я прочитал — к практике'}</button><button class="button primary" data-action="train" data-id="${t.id}">${icon('play')} ${state.learned[t.id] ? 'Тренировать по памяти' : 'Написать первую реализацию'}</button><div class="notice purple">${icon('repeat')}<span>${state.reviews[t.id] ? `Ближайшее повторение: ${relativeDate(state.reviews[t.id].due).toLowerCase()}.` : 'Первое решение нужно сейчас. После зачёта тема станет изученной, а повторение появится на следующий день.'}</span></div></aside></div>`;
}
function reviewRows(topics) {
  return `<div class="table-wrap"><table class="review-table"><thead><tr><th>Тема</th><th>Когда</th><th>Интервал</th><th><span class="muted">Действие</span></th></tr></thead><tbody>${topics.map(t => { const r = state.reviews[t.id]; return `<tr><td>${t.title}</td><td><span class="${r.due <= today() ? 'badge due-badge' : 'muted'}">${relativeDate(r.due)}</span></td><td class="muted">${INTERVALS[r.stage]} дн.</td><td><button class="button secondary" data-action="train" data-id="${t.id}">${r.due <= today() ? 'Повторить' : 'Тренировать'}</button></td></tr>`; }).join('')}</tbody></table></div>`;
}
function firstPracticeSection() {
  const topics=TOPICS.filter(t=>state.theoryRead[t.id]&&!state.learned[t.id]);
  if(!topics.length)return '';
  return '<section class="card"><div class="section-heading"><h2>Первая реализация — сейчас</h2><span class="badge">'+'Тем: '+topics.length+'</span></div><p class="tiny-empty">Теория уже прочитана. Напишите собственное решение и пройдите тесты: только после этого тема станет изученной.</p>'+topics.map(t=>'<div class="repeat-row">'+topicSymbol(t)+'<span class="repeat-info"><b>'+t.title+'</b><small>Ожидает первого правильного решения</small></span><button class="button secondary" data-action="train" data-id="'+t.id+'">Реализовать</button></div>').join('')+'</section>';
}
function reviews() {
  const due = dueTopics(), upcoming = upcomingTopics().filter(t => state.reviews[t.id].due > today());
  return `${intro('Повторения', 'Расписание повторений подстраивается под успешно выполненные тренировки.')}<div class="home-grid"><div class="main-column">${firstPracticeSection()}<section class="card"><div class="section-heading"><h2>Сегодня</h2><span class="badge">${due.length} тем</span></div>${due.length ? reviewRows(due) : empty('check', TOPICS.some(topic=>state.theoryRead[topic.id]&&!state.learned[topic.id]) ? 'Сначала — первая реализация' : 'На сегодня всё спокойно', TOPICS.some(topic=>state.theoryRead[topic.id]&&!state.learned[topic.id]) ? 'Выполните первую реализацию по темам выше. Повторения для них появятся только после прохождения тестов.' : state.learned && Object.keys(state.learned).length ? 'Повторения ещё не наступили. Можно изучить новую тему или потренироваться заранее.' : 'Прочитайте теорию и сразу напишите решение. Только после прохождения тестов тема попадёт в повторения.', '<button class="button secondary" data-action="nav" data-page="catalog">Открыть темы '+icon('arrow')+'</button>')}</section>${upcoming.length ? `<section class="card"><h2>Впереди</h2>${reviewRows(upcoming)}</section>` : ''}<section class="card"><h2>Как растёт интервал</h2><div class="timeline">${INTERVALS.map((d,i) => `<div class="timeline-stop"><b>${i+1}</b><span>${d} ${d === 1 ? 'день' : 'дней'}</span></div>`).join('')}</div><p class="rank-note">Первая реализация — сразу после теории. Первое повторение — через день после первой правильной реализации. Следующее — через 7 дней после успешного первого повторения, затем через 30, 90 и 180. Дальше — каждые 180 дней. Ошибка не сдвигает дату; просроченные задания остаются в списке.</p></section></div><aside class="right-column">${streakCard()}<div class="card"><h3>Что считается днём?</h3><p class="tiny-empty">Выполнены все задания, назначенные на день. Если назначенных тем нет — достаточно одной успешной тренировки. День заканчивается в 00:00 по Москве.</p><div class="notice neutral">${icon('info')}<span>Успешная тренировка на C++ или Python засчитывается после прохождения всех тестов. Расписание и результаты хранятся на сервере и доступны после входа с любого устройства.</span></div></div></aside></div>`;
}

function leaderboardKey() {return rankingType==='overall'?'overall':rankingType==='competition'?'competition':rankingType==='streak'?'streak:'+streakSort:'speed:'+rankingTopic+':'+rankingLanguage;}
function participantLink(row,label,className='') {
  const userId=row.userId||(row.isMe?account?.id:null), name=escapeHTML(label);
  return userId ? '<a class="participant-link '+className+'" href="#/user/'+escapeHTML(encodeURIComponent(userId))+'" title="Открыть профиль: '+name+'">'+name+'</a>' : '<span class="'+className+'" title="'+name+'">'+name+'</span>';
}
const displayRank = row => escapeHTML(row.rankLabel || (row.rankEnd>row.rank?row.rank+'–'+row.rankEnd:row.rank));
function rankingTime(ms) {return formatTime(ms,true)+'.'+String(ms%1000).padStart(3,'0');}
function leaderboardResults() {
  if(rankingScope==='friends')return empty('user','Рейтинг друзей пока не подключён','Сейчас доступны общие рейтинги скорости и выполненных дней. Друзей добавим вместе с подтверждением дружбы.');
  if(leaderboardState.key!==leaderboardKey()||leaderboardState.loading)return '<div class="empty-state" role="status"><div class="empty-icon">'+icon('clock')+'</div><h3>Загружаем проверенные результаты…</h3></div>';
  if(leaderboardState.error&&!leaderboardState.data)return empty('info','Не удалось загрузить рейтинг',escapeHTML(leaderboardState.error),'<button class="button outline" data-action="refresh-ranking">Повторить</button>');
  const data=leaderboardState.data;
  if(rankingType==='overall') {
    if(!data?.rows?.length)return empty('trophy','Рейтинг по темам ждёт первых решений','Пройдите тесты в любой теме — и получите первые баллы.');
    const row=r=>`<tr class="${r.isMe?'my-rank':''}"><td><b>${displayRank(r)}</b></td><td>${participantLink(r,r.isMe?account.displayName:r.label)}${r.isMe?' <span class="badge learned">Вы</span>':''}</td><td>${r.topicsCount}</td><td class="mono rank-time">${r.score}</td></tr>`;
    return `<div class="table-wrap"><table class="review-table"><thead><tr><th>Место</th><th>Участник</th><th>Тем с зачётом</th><th>Рейтинг</th></tr></thead><tbody>${data.rows.map(row).join('')}${data.ownRows?.length?'<tr class="rank-gap"><td colspan="4">Ваша позиция</td></tr>'+data.ownRows.map(row).join(''):''}</tbody></table></div><p class="rank-note">Участников: ${data.totalEntries}. Одинаковые итоговые баллы означают общее место. Диапазон показывает все занятые группой позиции.</p>`;
  }
  if(rankingType==='competition') {
    if(!data?.rows?.length&&data?.awaitingResults)return empty('clock','Проверяются результаты соревнований','Рейтинг обновится после проверки своевременных посылок.');
    if(!data?.rows?.length)return empty('trophy','Результатов соревнований пока нет','Рейтинг появится после завершённого соревнования и проверки решений.','<button class="button outline" data-action="nav" data-page="competitions">К соревнованиям '+icon('arrow')+'</button>');
    const row=record=>'<tr class="'+(record.isMe?'my-rank':'')+'"><td><b>'+displayRank(record)+'</b></td><td>'+participantLink(record,record.isMe?account.displayName:record.label)+(record.isMe?' <span class="badge learned">Вы</span>':'')+'</td><td>'+escapeHTML(record.competitionsCount)+'</td><td class="mono rank-time">'+escapeHTML(record.rating)+'</td></tr>';
    const own=data.ownRows?.length?'<tr class="rank-gap"><td colspan="4">Ваша позиция</td></tr>'+data.ownRows.map(row).join(''):'';
    return '<div class="table-wrap"><table class="review-table"><thead><tr><th>Место</th><th>Участник</th><th>Соревнований</th><th>Рейтинг</th></tr></thead><tbody>'+data.rows.map(row).join('')+own+'</tbody></table></div><p class="rank-note">Участников: '+escapeHTML(data.totalEntries)+'. Одинаковый рейтинг даёт общее место.</p>'+(data.awaitingResults?'<p class="rank-note">Ожидаем проверку посылок перед следующим пересчётом рейтинга.</p>':'');
  }
  if(rankingType==='streak') {
    if(!data?.rows?.length)return empty('flame','Выполненных дней пока нет','Первый день появится после правильной реализации. Дальше нужно выполнять все назначенные повторения.');
    const row=r=>'<tr class="'+(r.isMe?'my-rank':'')+'"><td><b>'+displayRank(r)+'</b></td><td>'+participantLink(r,r.isMe?account.displayName:r.label)+(r.isMe?' <span class="badge learned">Вы</span>':'')+'</td><td>'+r.totalDays+'</td><td class="mono rank-time">'+r.current+'</td></tr>';
    const own=data.ownRows?.length?'<tr class="rank-gap"><td colspan="4">Ваша позиция за пределами первой сотни</td></tr>'+data.ownRows.map(row).join(''):'';
    return '<div class="table-wrap"><table class="review-table"><thead><tr><th>Место</th><th>Участник</th><th>Выполнено дней</th><th>Серия (дней)</th></tr></thead><tbody>'+data.rows.map(row).join('')+own+'</tbody></table></div><p class="rank-note">Участников: '+data.totalEntries+'. Дни и серии рассчитаны по серверным зачётам. Защитный день сохраняет серию, но не прибавляет выполненный день.</p>';
  }
  if(!data?.rows?.length)return empty('trophy','Правильных решений пока нет','В выбранной теме и языке ещё нет результатов, прошедших все тесты. После зачёта результат появится здесь автоматически.','<button class="button outline" data-action="train" data-id="'+rankingTopic+'">Тренировать '+icon('arrow')+'</button>');
  const row=r=>'<tr class="'+(r.isMe?'my-rank':'')+'"><td><b>'+displayRank(r)+'</b></td><td>'+participantLink(r,r.isMe?account.displayName:r.label)+(r.isMe?' <span class="badge learned">Вы</span>':'')+'</td><td>'+escapeHTML(languageById(r.language).name)+'</td><td class="mono rank-time">'+rankingTime(r.elapsedMs)+'</td></tr>';
  const own=data.ownRows?.length?'<tr class="rank-gap"><td colspan="4">Ваши результаты за пределами первой сотни</td></tr>'+data.ownRows.map(row).join(''):'';
  return '<div class="table-wrap"><table class="review-table"><thead><tr><th>Место</th><th>Участник</th><th>Язык</th><th>Время написания</th></tr></thead><tbody>'+data.rows.map(row).join('')+own+'</tbody></table></div><p class="rank-note">Результатов: '+data.totalEntries+'. Данные обновляются автоматически. Время указано с точностью до миллисекунд. '+(rankingLanguage==='all'?'У каждого участника учитывается одно лучшее время среди всех языков.':'У каждого участника учитывается лучшее время на выбранном языке.')+' Одинаковое время означает общее место.</p>';
}
function leaderboardContents() {
  return leaderboardResults().replaceAll('class="table-wrap"','class="table-wrap" data-scroll-key="'+escapeHTML('leaderboard:'+leaderboardKey())+'"');
}
function updateLeaderboardResults() {
  const notice=leaderboardState.error&&leaderboardState.data?'<p class="rank-note" role="status">Не удалось обновить рейтинг. Показаны последние загруженные результаты. '+escapeHTML(leaderboardState.error)+'</p>':'';
  replaceViewHTML(document.querySelector('#leaderboard-results'),notice+leaderboardContents());
}
async function loadLeaderboard(force=false) {
  if(route().page!=='rankings'||rankingScope!=='all')return;
  const key=leaderboardKey();
  if(leaderboardState.key===key&&(leaderboardState.loading||leaderboardState.refreshing||(!force&&leaderboardState.data)))return;
  const request=++leaderboardRequest;
  const previous=leaderboardState.key===key?leaderboardState.data:null;
  leaderboardState={key,loading:!previous,refreshing:true,data:previous,error:''};
  if(!previous)updateLeaderboardResults();
  try {
    const data=rankingType==='overall'?await getOverallLeaderboard():rankingType==='competition'?await getCompetitionLeaderboard():rankingType==='streak'?await getStreakLeaderboard(streakSort):await getLeaderboard(rankingTopic,rankingLanguage);
    if(request!==leaderboardRequest)return;
    leaderboardState={key,loading:false,refreshing:false,data,error:''};
  }catch(error){if(request!==leaderboardRequest)return;leaderboardState={key,loading:false,data:previous,error:error.message};}
  updateLeaderboardResults();
}
function overallDescription(){return '<b>Рейтинг по темам</b><p>В каждой теме берём ваше лучшее время среди всех языков. За место p начисляется 1/√p. Если время совпало у нескольких учеников, они поровну делят сумму вкладов занятых мест. Складываем вклад всех тем, умножаем на 1000 и округляем итог до целого.</p><p class="mono">Рейтинг = round(1000 × Σ вклад темы)</p><p>Например, два участника делят места 2–3: каждый получает (1/√2 + 1/√3) / 2. В одной теме это примерно <b>642 балла</b>. Без ничьих места 2 и 3 в двух разных темах дают <b>1284 балла</b>.</p><p>В рейтинге по темам одинаковые итоговые баллы дают общее место, например 2–4; следующий участник получает место 5. Если группа делит пятую позицию, в ТОП-5 попадут все её участники. Тема без зачёта даёт 0; одна тема учитывается один раз.</p>';}
function topFive() {
  const rows=Array.isArray(topFiveState.data?.rows)?topFiveState.data.rows:[];
  const own=(Array.isArray(topFiveState.data?.ownRows)?topFiveState.data.ownRows:[]).find(row=>row.isMe===true&&Number.isSafeInteger(row.rank)&&row.rank>5&&!rows.some(leader=>leader.isMe||(row.key&&leader.key===row.key)||(row.userId&&leader.userId===row.userId)));
  const row=(record,separate=false)=>`<div class="top-five-row ${record.isMe?'is-me':''}${separate?' top-five-own-row':''}"><span class="top-five-place">${displayRank(record)}</span>${participantLink(record,record.isMe?account?.displayName||record.label:record.label,'top-five-name')}${record.isMe?'<span class="badge learned top-five-you">Вы</span>':''}<b>${escapeHTML(record.score)}</b></div>`;
  const content=rows.length?rows.map(record=>row(record)).join(''):topFiveState.loading?'<p>Загружаем лидеров…</p>':topFiveState.error?'<p>Не удалось загрузить рейтинг.</p>':'<p>Зачтённых решений пока нет.</p>';
  return '<button class="top-five-heading" data-action="overall-ranking">'+icon('trophy')+'<b>По темам · ТОП-5</b>'+icon('chevron')+'</button><div class="top-five-list">'+content+(own?row(own,true):'')+'</div>'+(rows.length>5?'<p class="top-five-ties">Показаны все участники, разделившие место в ТОП-5.</p>':'')+'<button class="text-link" data-action="overall-ranking">Весь рейтинг '+icon('arrow')+'</button>';
}
async function loadTopFive(force=false) {
  if(!account)return;
  if(topFiveState.loading){if(force)topFiveRefreshAgain=true;return;}
  if(!force&&Date.now()-topFiveState.loadedAt<30000)return;
  const generation=accountGeneration;topFiveState.loading=true;
  try{const data=await getOverallLeaderboard(5);if(generation!==accountGeneration)return;topFiveState={data,loading:false,error:'',loadedAt:Date.now()};}
  catch(error){if(generation!==accountGeneration)return;topFiveState={...topFiveState,loading:false,error:error.message,loadedAt:Date.now()};}
  replaceViewHTML(document.querySelector('#sidebar-top-five'),topFive());
  if(topFiveRefreshAgain){topFiveRefreshAgain=false;loadTopFive(true);}
}
function streakTopFive() {
  const rows=streakTopFiveRows(streakTopFiveState.data);
  const own=[...(Array.isArray(streakTopFiveState.data?.rows)?streakTopFiveState.data.rows:[]),...(Array.isArray(streakTopFiveState.data?.ownRows)?streakTopFiveState.data.ownRows:[])].find(record=>record.isMe===true&&Number.isSafeInteger(record.rank)&&record.rank>5&&!rows.some(leader=>leader.isMe||(record.userId&&leader.userId===record.userId)||(record.participantKey&&leader.participantKey===record.participantKey)));
  const row=(record,separate=false)=>`<div class="top-five-row ${record.isMe?'is-me':''}${separate?' top-five-own-row':''}"><span class="top-five-place">${displayRank(record)}</span>${participantLink(record,record.isMe?account?.displayName||record.label:record.label,'top-five-name')}${record.isMe?'<span class="badge learned top-five-you">Вы</span>':''}<b class="series-days">${seriesDays(record.current)}</b></div>`;
  const content=rows.length?rows.map(record=>row(record)).join(''):streakTopFiveState.loading?'<p role="status">Загружаем серии…</p>':streakTopFiveState.error?'<p>Не удалось загрузить серии.</p>':'<p>Начните свою серию с первого зачёта.</p>';
  const status=rows.length&&streakTopFiveState.error?'<p class="top-five-status">Не удалось обновить. Показаны последние данные.</p>':rows.length&&streakTopFiveState.loading?'<p class="top-five-status">Обновляем…</p>':'';
  return '<button class="top-five-heading" data-action="streak-ranking">'+icon('flame')+'<b>Серия изучений · ТОП-5</b>'+icon('chevron')+'</button><div class="top-five-list">'+content+(own?row(own,true):'')+'</div>'+status+(rows.length>5?'<p class="top-five-ties">Показаны все участники, разделившие место в ТОП-5.</p>':'')+(streakTopFiveState.error?'<button class="text-link top-five-retry" data-action="refresh-streak-top-five">Обновить '+icon('repeat')+'</button>':'')+'<button class="text-link" data-action="streak-ranking">Весь рейтинг '+icon('arrow')+'</button>';
}
async function loadStreakTopFive(force=false) {
  if(!account)return;
  if(streakTopFiveState.loading){if(force)streakTopFiveRefreshAgain=true;return;}
  if(!force&&Date.now()-streakTopFiveState.loadedAt<30000)return;
  const generation=accountGeneration;streakTopFiveState.loading=true;
  const initial=document.querySelector('#sidebar-streak-top-five');if(initial&&!streakTopFiveState.data)replaceViewHTML(initial,streakTopFive());
  try{const data=await getStreakLeaderboard('series');if(generation!==accountGeneration)return;streakTopFiveState={data,loading:false,error:'',loadedAt:Date.now()};}
  catch(error){if(generation!==accountGeneration)return;streakTopFiveState={...streakTopFiveState,loading:false,error:error.message,loadedAt:Date.now()};}
  if(generation!==accountGeneration)return;
  replaceViewHTML(document.querySelector('#sidebar-streak-top-five'),streakTopFive());
  if(streakTopFiveRefreshAgain){streakTopFiveRefreshAgain=false;loadStreakTopFive(true);}
}
function competitionTopFive() {
  const rows=(Array.isArray(competitionTopFiveState.data?.rows)?competitionTopFiveState.data.rows:[]).filter(row=>Number.isSafeInteger(row.rank)&&row.rank>=1&&row.rank<=5);
  const own=(Array.isArray(competitionTopFiveState.data?.ownRows)?competitionTopFiveState.data.ownRows:[]).find(row=>row.isMe===true&&Number.isSafeInteger(row.rank)&&row.rank>5&&!rows.some(leader=>leader.isMe||leader.userId===row.userId));
  const row=(record,separate=false)=>'<div class="top-five-row '+(record.isMe?'is-me':'')+(separate?' top-five-own-row':'')+'"><span class="top-five-place">'+displayRank(record)+'</span>'+participantLink(record,record.isMe?account?.displayName||record.label:record.label,'top-five-name')+(record.isMe?'<span class="badge learned top-five-you">Вы</span>':'')+'<b>'+escapeHTML(record.rating)+'</b></div>';
  const content=rows.length?rows.map(record=>row(record)).join(''):competitionTopFiveState.loading?'<p role="status">Загружаем рейтинг…</p>':competitionTopFiveState.error?'<p>Не удалось загрузить рейтинг.</p>':'<p>Рейтинг появится после первого соревнования.</p>';
  const status=rows.length&&competitionTopFiveState.error?'<p class="top-five-status">Не удалось обновить. Показаны последние данные.</p>':'';
  return '<button class="top-five-heading" data-action="competition-ranking">'+icon('trophy')+'<b>По соревнованиям · ТОП-5</b>'+icon('chevron')+'</button><div class="top-five-list">'+content+(own?row(own,true):'')+'</div>'+status+(rows.length>5?'<p class="top-five-ties">Показаны все участники, разделившие место в ТОП-5.</p>':'')+(competitionTopFiveState.error?'<button class="text-link" data-action="refresh-competition-top-five">Обновить '+icon('repeat')+'</button>':'')+'<button class="text-link" data-action="competition-ranking">Весь рейтинг '+icon('arrow')+'</button>';
}
async function loadCompetitionTopFive(force=false) {
  if(!account)return;
  if(competitionTopFiveState.loading){if(force)competitionTopFiveRefreshAgain=true;return;}
  if(!force&&Date.now()-competitionTopFiveState.loadedAt<30000)return;
  const generation=accountGeneration;competitionTopFiveState.loading=true;
  const initial=document.querySelector('#sidebar-competition-top-five');if(initial&&!competitionTopFiveState.data)replaceViewHTML(initial,competitionTopFive());
  try{const data=await getCompetitionLeaderboard(5);if(generation!==accountGeneration)return;competitionTopFiveState={data,loading:false,error:'',loadedAt:Date.now()};}
  catch(error){if(generation!==accountGeneration)return;competitionTopFiveState={...competitionTopFiveState,loading:false,error:error.message,loadedAt:Date.now()};}
  replaceViewHTML(document.querySelector('#sidebar-competition-top-five'),competitionTopFive());
  if(competitionTopFiveRefreshAgain){competitionTopFiveRefreshAgain=false;loadCompetitionTopFive(true);}
}
function competitionRatingDescription() {
  return '<b>Рейтинг соревнований · Эло с весом турнира</b><p>Начальный рейтинг — 1200. Результат сравнивается с каждым соперником: победа даёт 1, ничья ½, поражение 0. Ожидание зависит от разницы рейтингов. Средняя разница между результатом и ожиданием умножается на 32 и на вес турнира log₂(N).</p><p class="mono">Rнов = R + 32 × log₂(N) × среднее(S − E)<br>E = 1 / (1 + 10^((Rсоперника − R) / 400))</p><p>N — число участников, вошедших в рейтинговое соревнование во время его проведения, даже без посылок. При равных исходных рейтингах победитель дуэли получает <b>+16</b>, турнира на четверых — <b>+32</b>, на восьмерых — <b>+48</b>, на шестнадцать — <b>+64</b>. Изменение зависит одновременно от места, силы соперников и числа рейтинговых участников.</p><p>Рейтинговый режим выбирается при создании. Если вошло меньше двух участников или никто не сдал ни одной темы, рейтинг не меняется. Расчёт ведётся с дробной точностью, для отображения рейтинг округляется до целого.</p><p>Рейтинг публикуется после проверки своевременных посылок. Вся история, график и таблицы пересчитываются по этой формуле; аннулирование результата пересчитывает последующие соревнования.</p>';
}
function rankings() {
  const tabs=[['overall','trophy','По темам'],['speed','clock','Скорость решений'],['streak','flame','Серия изучений'],['competition','trophy','По соревнованиям']];
  const filters=rankingType==='speed'?'<select id="ranking-topic" aria-label="Тема рейтинга">'+TOPICS.map(t=>'<option value="'+t.id+'" '+(rankingTopic===t.id?'selected':'')+'>'+t.title+'</option>').join('')+'</select><select id="ranking-language" aria-label="Язык рейтинга"><option value="all">Все языки</option>'+LANGUAGES.filter(l=>['python','cpp'].includes(l.id)).map(l=>'<option value="'+l.id+'" '+(rankingLanguage===l.id?'selected':'')+'>'+l.name+'</option>').join('')+'</select>':rankingType==='streak'?'<select id="streak-sort" aria-label="Порядок рейтинга дней"><option value="series" '+(streakSort==='series'?'selected':'')+'>По текущей серии</option><option value="days" '+(streakSort==='days'?'selected':'')+'>По выполненным дням</option></select>':'';
  return intro('Рейтинги','')+'<div class="filter-tabs" role="group" aria-label="Вид рейтинга">'+tabs.map(([value,i,title])=>'<button class="filter-tab '+(rankingType===value?'active':'')+'" data-action="rank-type" data-value="'+value+'" aria-pressed="'+(rankingType===value)+'">'+icon(i)+' '+title+'</button>').join('')+'</div>'+
  (['overall','competition'].includes(rankingType)?'<details class="card rating-explanation"><summary>Как считается рейтинг</summary>'+(rankingType==='overall'?overallDescription():competitionRatingDescription())+'</details>':'')+
  '<section class="card"><div class="section-heading"><h2>'+({overall:'По темам',speed:'Самые быстрые решения',streak:'Серия изучений',competition:'По соревнованиям'})[rankingType]+'</h2><button class="text-link" data-action="refresh-ranking">Обновить '+icon('repeat')+'</button></div><div class="rank-controls"><div class="segmented" role="group" aria-label="Участники рейтинга"><button class="'+(rankingScope==='all'?'active':'')+'" data-action="rank-scope" data-value="all" aria-pressed="'+(rankingScope==='all')+'">Все участники</button><button class="'+(rankingScope==='friends'?'active':'')+'" data-action="rank-scope" data-value="friends" aria-pressed="'+(rankingScope==='friends')+'">Друзья</button></div>'+filters+'</div><div id="leaderboard-results" aria-live="polite">'+leaderboardContents()+'</div></section>';
}
setInterval(()=>{if(document.visibilityState==='visible'&&route().page==='rankings')loadLeaderboard(true);},10000);
setInterval(()=>{if(account&&document.visibilityState==='visible'){loadTopFive();loadStreakTopFive();loadCompetitionTopFive();}},30000);

function personalRecordContents(session) {
  const model=trainingRecordModel(session.personalRecord,Date.now()+clockOffset-session.startedAt);
  return `<div class="record-card-heading"><div><h2>Личный рекорд по теме · все языки</h2><div class="personal-record-value ${Number.isFinite(session.personalRecord?.bestMs)?'mono':''}">${escapeHTML(model.best)}</div></div>${model.rank?'<span class="record-rank">Место <b>'+escapeHTML(model.rank)+'</b></span>':''}</div>${model.baseline?'<p class="record-baseline">'+escapeHTML(model.baseline)+'</p>':''}<p id="personal-record-comparison" class="record-comparison ${model.comparison.tone}">${escapeHTML(model.comparison.text)}</p>${model.placeComparison?.text?'<p class="record-position-change '+escapeHTML(model.placeComparison.tone)+'">'+escapeHTML(model.placeComparison.text)+'</p>':''}${model.nextPlace?'<p class="record-next-place">'+escapeHTML(model.nextPlace)+'</p>':''}`;
}
function refreshTrainingMetadata() {
  const session=state.active;if(route().page!=='training'||!session)return;
  const card=document.querySelector('#personal-record-card');
  if(card&&card.dataset.sessionId===session.id)replaceViewHTML(card,personalRecordContents(session));
  const timer=document.querySelector('#live-timer');if(timer)timer.textContent=formatTime(session.best??Date.now()+clockOffset-session.startedAt);
  if(session.best===null)return;
  const caption=document.querySelector('#timer-caption');if(caption)caption.innerHTML=icon('clock')+' Первая верная отправка';
  const model=trainingRecordModel(session.personalRecord),notice=document.querySelector('#judge-notice');
  if(notice){
    notice.className='notice success'+(model.result?.tone==='record'?' personal-record-result':'');
    const content=model.result?icon(model.result.tone==='record'?'trophy':'check')+'<span><b>'+escapeHTML(model.result.title)+'</b><br>'+escapeHTML(model.result.detail)+'</span>':icon('check')+'<span>Решение прошло все тесты. Засчитано серверное время первой правильной отправки.</span>';
    replaceViewHTML(notice,content);
  }
}

function taskDescription(t) {
  if(!t)return '<p>Условие темы недоступно.</p>';
  return `<div class="lesson-tag-row"><span class="badge">${t.category}</span><span class="badge mono">${t.complexity}</span></div><h2>Условие</h2><p>${escapeHTML(t.task)}</p>${sourcePolicyNotice(t)}${runtimeLimitsNotice(t)}<h3>Входные данные</h3><p>${escapeHTML(t.input)}</p><h3>Выходные данные</h3><p>${escapeHTML(t.output)}</p><h3>${t.additionalExamples?.length ? 'Примеры' : 'Пример'}</h3>${examples(t)}<div class="notice neutral" style="margin-top:20px">${icon('info')}<span>Запрет вставки помогает тренировать память, но сам по себе не защищает публичные соревнования от нечестной игры.</span></div>`;
}
function training() {
  const session = state.active;
  if (!session) return `${intro('Тренировка', 'Выберите алгоритм и попробуйте написать его по памяти.')}<div class="card">${empty('code', 'Начните первую тренировку', 'Полное условие будет над редактором. Таймер запустится только после вашего подтверждения.', '<button class="button primary" data-action="nav" data-page="catalog">Выбрать алгоритм '+icon('arrow')+'</button>')}</div>`;
  const t = topicForSession(session), language = languageById(session.language), outdated=t?.archived || (session.taskVersion??1)<(topicById(session.topic)?.taskVersion??1);
  if(!t)return empty("book","Тема недоступна","Код попытки сохранён в истории.",'<button class="button outline" data-action="nav" data-page="catalog">Открыть темы</button>');
  return `<div class="training-intro">${intro(t.title, 'Тренировка по памяти · внутренний буфер для своего кода', '<button class="button outline" data-action="end-session">Завершить '+icon('logout')+'</button>')}</div>${outdated?'<div class="notice"><span>Условие этой темы обновилось. Старая попытка и её результат сохранены в истории. Для нового формата начните новую тренировку.</span><button class="button secondary" data-action="train" data-id="'+(t.replacementTopic||session.topic)+'">Начать новую тренировку</button></div>':''}<div class="training-layout"><aside class="card task-panel">${taskDescription(t)}</aside><div class="training-main"><section class="card personal-record-card" id="personal-record-card" data-session-id="${escapeHTML(session.id)}">${personalRecordContents(session)}</section><div class="card timer-bar"><div><div class="timer-label" id="timer-caption">${icon('clock')} ${session.best === null ? 'Время написания' : 'Первая верная отправка'}</div><div class="timer-value" id="live-timer">${formatTime(session.best ?? Date.now() + clockOffset - session.startedAt)}</div></div><div class="timer-actions"><button class="button ghost" data-action="download-code">${icon('download')} Код</button><button class="button primary" data-action="submit-code" ${outdated?'disabled':''}>Отправить ${icon('send')}</button></div></div>${draftConflicts.has(session.id)?`<div class="notice" role="alert"><span>Черновик изменён на другом устройстве. Выберите, какую версию продолжить.</span><button class="button outline" data-action="draft-use-server">Взять с сервера</button><button class="button outline" data-action="draft-use-mine">Сохранить мой</button></div>`:""}${fairPlayNotice()}<div class="code-workbench"><div class="editor-workspace"><div class="editor-panel"><div class="editor-toolbar"><div class="file-tab"><span class="dot"></span><span id="file-name">solution.${language.extension}</span></div><select id="editor-language" aria-label="Язык программирования">${languageOptions(t, session.language)}</select></div><div class="editor-body"><div class="line-numbers" id="line-numbers" aria-hidden="true">${lineNumbers(session.code)}</div><div class="code-viewport"><pre class="code-highlight" id="code-highlight" aria-hidden="true"></pre><textarea class="code-input" id="code-input" aria-label="Код решения на языке ${language.name}" placeholder="Напишите решение здесь…" name="practice-source" autocomplete="off" data-1p-ignore="true" data-op-ignore="true" data-lpignore="true" data-form-type="other" autocorrect="off" autocapitalize="off" spellcheck="false" wrap="off">${escapeHTML(session.code)}</textarea></div></div><div class="editor-status"><span>${icon('lock')} Внешняя вставка отключена</span><span id="character-count">${session.code.length} символов · черновик на сервере</span></div></div>${editorClipboardPanel.panel(session)}</div>${customTestRunner.panel(session,{exampleInput:t.exampleIn})}</div><div class="notice ${session.best !== null ? 'success' : 'neutral'}" id="judge-notice">${icon(session.best !== null ? 'check' : 'info')}<span>${session.best !== null ? 'Решение прошло все тесты. Засчитано серверное время первой правильной отправки.' : session.server ? 'Программа проверяется на сервере. Продолжайте писать и отправлять версии, пока идут тесты.' : 'Эта попытка начата до подключения сервера. Начните новую тренировку, чтобы отправлять код на настоящую проверку.'}</span></div><section class="card submissions"><h2>Отправки <span class="muted">· ${session.submissions.length}</span></h2><div id="submission-list">${submissionList(session)}</div></section></div></div>`;
}
function lineNumbers(code) { return Array.from({ length: Math.max(12, code.split('\n').length) }, (_, i) => i + 1).join('\n'); }
function submissionList(session) {
  if (!session.submissions.length) return '<p class="tiny-empty">Здесь будет результат каждой отправленной версии. Редактор остаётся доступен во время проверки.</p>';
  const labels = { pending: 'В очереди', unavailable: 'Проверка временно недоступна', delivery_unknown: 'Уточняем доставку', rejected: 'Отклонено сервером', accepted: 'Верное решение', wrong_answer: 'Неверный ответ', compile_error: 'Ошибка компиляции', runtime_error: 'Ошибка выполнения', time_limit: 'Превышено время', policy_violation: 'Нарушение ограничения задачи' };
  return [...session.submissions].reverse().map((s, i) => `<div class="submission">${icon(s.status === 'accepted' ? 'check' : s.status === 'pending' ? 'clock' : 'info')}<div><b>#${session.submissions.length-i} · ${labels[s.status] || 'Ожидание'}</b><p>${escapeHTML(s.message)}${s.status === 'pending' ? ' Вы можете продолжать писать и отправить новую версию.' : ''}${Number.isInteger(s.total) && s.total > 0 ? ` · Тесты: ${s.passed || 0}/${s.total}` : ''}</p>${s.status === 'delivery_unknown' ? `<button class="text-link" data-action="retry-submission" data-id="${escapeHTML(s.clientId || s.id)}">Повторить доставку</button>` : ''}${submissionRetestContents(s,session)}</div><span class="mono" title="Время от старта до отправки">${formatTime(s.elapsedMs)}</span></div>`).join('');
}
function submissionRetestContents(submission,session) {
  if(!session.server||!submission.confirmed)return '';
  const view=ownerRetests.view(submission.id);
  if(submission.status!=='unavailable'&&!view.retest)return '';
  const button=submission.status==='unavailable'||view.retest?.state==='pending'?'<button type="button" class="text-link" data-action="retest-submission" data-id="'+escapeHTML(submission.id)+'"'+(view.busy?' disabled':'')+'>'+escapeHTML(view.label)+'</button>':'';
  const message=view.error||view.retest?.message;
  return button+(message?'<p class="rank-note" role="'+(view.error?'alert':'status')+'">'+escapeHTML(message)+'</p>':'');
}
function userFullName(user){
  return [user?.lastName,user?.firstName].filter(value=>typeof value==='string'&&value.trim()).map(value=>value.trim()).join(' ');
}
function publicUserContents(id) {
  if(!id || (publicUserState.id===id&&[400,404].includes(publicUserState.status)))return `<section class="card">${empty('user','Пользователь не найден','Проверьте ссылку или откройте профиль участника из рейтинга.','<button class="button outline" data-action="overall-ranking">К рейтингу '+icon('arrow')+'</button>')}</section>`;
  if(publicUserState.id!==id||(publicUserState.loading&&!publicUserState.data))return `<section class="card"><div class="empty-state" role="status"><div class="empty-icon">${icon('user')}</div><h3>Загружаем профиль…</h3></div></section>`;
  if(publicUserState.error&&!publicUserState.data)return `<section class="card">${empty('info','Не удалось загрузить профиль',escapeHTML(publicUserState.error),'<button class="button outline" data-action="refresh-user-profile">Повторить '+icon('repeat')+'</button>')}</section>`;
  const data=publicUserState.data;
  if(!data?.user)return '';
  const name=data.user.displayName, fullName=userFullName(data.user), records=(data.topics||[]).filter(record=>topicById(record.topic)), compare=data.user.id!==account.id;
  const header=`<section class="card public-profile-summary"><div class="profile-large"><div class="avatar">${escapeHTML(Array.from(name)[0]?.toUpperCase()||'?')}</div><div><h2>${escapeHTML(name)}</h2><p class="public-profile-full-name${fullName?'':' muted'}">${fullName?escapeHTML(fullName):'Имя и фамилия пока не указаны'}</p><p>Публичный профиль${data.user.id===account.id?' · это вы':''}</p></div></div><div class="public-profile-count"><b>${escapeHTML(data.learnedCount)}</b><span>тем с зачётом</span></div>${data.user.id===account.id?'<a class="text-link" href="#/dashboard">Мой кабинет '+icon('arrow')+'</a>':''}<button class="text-link" data-action="refresh-user-profile">Обновить ${icon('repeat')}</button></section>`;
  const rankings=publicProfileRankings(data.rankings), competitionHistory=profileCompetitionHistory(data.competitionHistory,{initialRating:data.competitionInitialRating})
    .replace('class="table-wrap"','class="table-wrap" data-scroll-key="'+escapeHTML('profile:'+id+':history')+'"')
    .replace('class="profile-rating-chart-wrap"','class="profile-rating-chart-wrap" data-scroll-key="'+escapeHTML('profile:'+id+':chart')+'"');
  if(!records.length)return header+rankings+competitionHistory+`<section class="card">${empty('book','Изученных тем пока нет','Темы появятся здесь после первой реализации, прошедшей все тесты.')}</section>`;
  const row=record=>{const topic=topicById(record.topic),hasTime=Number.isSafeInteger(record.bestMs)&&record.bestMs>=0;return `<tr><td><a class="public-profile-topic" href="#/lesson/${escapeHTML(topic.id)}">${escapeHTML(topic.title)}</a><small>${escapeHTML(topic.category)}</small></td><td class="mono rank-time">${hasTime?rankingTime(record.bestMs):'Нет результата'}${record.isCurrent===false&&hasTime?'<small class="historical-record-label">Предыдущая версия</small>':''}</td><td>${(record.languages||[]).map(language=>escapeHTML(languageById(language).name)).join(', ')||'—'}</td><td>${record.isCurrent===false?'<span class="muted">Нет места</span><small>Нужна новая реализация</small>':'<b>'+displayRank(record)+'</b><small>из '+escapeHTML(record.totalEntries)+'</small>'}</td>${compare?'<td class="profile-comparison-cell">'+publicRecordComparison(record)+'</td>':''}</tr>`;};
  return header+rankings+competitionHistory+`<section class="card public-profile-results"><div class="section-heading"><h2>Изученные темы</h2></div><div class="table-wrap" data-scroll-key="${escapeHTML("profile:"+id+":topics")}"><table class="review-table public-profile-table"><thead><tr><th>Тема</th><th>Лучшее время</th><th>Язык</th><th>Место по теме</th>${compare?'<th>Сравнение с вами</th>':''}</tr></thead><tbody>${records.map(row).join('')}</tbody></table></div><p class="rank-note">Учитывается лучшее время написания среди всех языков. Место рассчитано среди всех участников темы. При одинаковом времени ученики делят места, указанные диапазоном. ${compare?'Сравнение — с вашим лучшим зачётом по той же версии задачи. ':''}Результат предыдущей версии сохраняется в списке изученных тем, но для места в текущем рейтинге нужна новая реализация.</p></section>`;
}
function publicRecordComparison(record) {
  if(record.isCurrent===false)return '<span class="muted">Предыдущая версия — без сравнения</span>';
  if(!Number.isSafeInteger(record.bestMs)||record.bestMs<0)return '<span class="muted">Нет результата для сравнения</span>';
  if(!Number.isSafeInteger(record.viewerBestMs)||record.viewerBestMs<0)return '<span class="muted">У вас ещё нет зачёта</span>';
  const delta=record.bestMs-record.viewerBestMs, tone=delta<0?'viewer-behind':delta>0?'viewer-ahead':'tied';
  const text=delta<0?'Быстрее вас на '+rankingTime(-delta):delta>0?'Медленнее вас на '+rankingTime(delta):'Одинаковое время';
  return '<span class="profile-time-comparison '+tone+'">'+escapeHTML(text)+'</span><small>Ваш рекорд: <span class="mono">'+rankingTime(record.viewerBestMs)+'</span></small>';
}
function ratingPoints(value) {
  const absolute=Math.abs(value),last=absolute%10,hundred=absolute%100;
  const unit=hundred>=11&&hundred<=14?'баллов':last===1?'балл':last>=2&&last<=4?'балла':'баллов';
  return value+' '+unit;
}
function publicProfileRankings(rankings={}) {
  const cards=[['overall','По темам','trophy','score'],['series','Серия изучений','flame','current'],['competition','По соревнованиям','trophy','rating'],['days','Выполненные дни','calendar','totalDays']];
  return `<section class="public-global-rankings" aria-label="Места в общих рейтингах">${cards.map(([key,label,symbol,field])=>{
    const record=rankings?.[key],placed=Number.isSafeInteger(record?.rank)&&record.rank>0,validValue=Number.isSafeInteger(record?.[field])&&(key==='competition'||record[field]>=0);
    const value=placed&&validValue?(['overall','competition'].includes(key)?ratingPoints(record[field]):seriesDays(record[field])):'Пока нет результата';
    const position=placed?'Место '+(record.rankLabel||record.rank)+' из '+record.totalEntries:'Нет места в рейтинге';
    return `<button type="button" class="card public-ranking-card" data-action="public-profile-ranking" data-value="${key}" aria-label="${escapeHTML(label+': '+position+'. '+value)}"><span class="public-ranking-heading">${icon(symbol)}${label}</span><span class="public-ranking-place">${placed?displayRank(record):'—'}</span><span class="public-ranking-position">${placed?'место из '+escapeHTML(record.totalEntries):'Нет места в рейтинге'}</span><span class="public-ranking-value">${escapeHTML(value)}${icon('arrow')}</span></button>`;
  }).join('')}</section>`;
}
function openPublicProfileRanking(kind) {
  if(!['overall','series','days','competition'].includes(kind))return;
  rankingType=kind==='overall'?'overall':kind==='competition'?'competition':'streak';
  if(['series','days'].includes(kind))streakSort=kind;
  rankingScope='all';leaderboardState.key=null;navigate('rankings');
}
function publicUserPage() {
  return `<div class="public-user-page">${intro('Профиль пользователя','Изученные темы, личные рекорды и места в рейтингах.','<button class="button outline" data-action="overall-ranking">'+icon('back')+' К рейтингу</button>')}<div id="public-user-results" aria-live="polite">${publicUserContents(route().id)}</div></div>`;
}
function updatePublicUserResults() {
  const current=route();if(current.page!=='user')return;
  const notice=publicUserState.id===current.id&&publicUserState.data&&publicUserState.error?'<p class="rank-note" role="status">Не удалось обновить профиль. Показаны последние загруженные данные. '+escapeHTML(publicUserState.error)+'</p>':'';
  replaceViewHTML(document.querySelector('#public-user-results'),notice+publicUserContents(current.id));
}
function invalidateOwnPublicProfile() {
  const id=account?.id;if(!id)return;
  const current=route();publicUserRequest++;
  if(current.page==='user'&&current.id===publicUserState.id){publicUserState={...publicUserState,loading:false,loadedAt:0};return loadPublicUser(true);}
  publicUserState={id:null,data:null,loading:false,error:'',status:null,loadedAt:0};
  if(current.page==='user'&&current.id)return loadPublicUser(true);
}
async function loadPublicUser(force=false) {
  const current=route(),id=current.id;
  if(!account||current.page!=='user'||!id)return;
  if(publicUserState.id===id&&(publicUserState.loading||(!force&&(publicUserState.data||publicUserState.error)&&Date.now()-publicUserState.loadedAt<30000)))return;
  const request=++publicUserRequest,generation=accountGeneration;
  const previous=publicUserState.id===id?publicUserState.data:null;
  publicUserState={id,data:previous,loading:true,error:'',status:null};if(!previous)updatePublicUserResults();
  try {
    const data=await getPublicProfile(id);
    if(request!==publicUserRequest||generation!==accountGeneration)return;
    publicUserState={id,data,loading:false,error:'',status:200,loadedAt:Date.now()};
  }catch(error){
    if(request!==publicUserRequest||generation!==accountGeneration)return;
    publicUserState={id,data:[400,401,403,404].includes(error.status)?null:previous,loading:false,error:error.message,status:error.status,loadedAt:Date.now()};
  }
  updatePublicUserResults();
}
function accountSettings() {
  return `<div class="profile-grid"><section class="card"><div class="profile-large"><div class="avatar">${escapeHTML(account.displayName[0]?.toUpperCase())}</div><div><h2>${escapeHTML(account.displayName)}</h2><p>${escapeHTML(account.email)}</p></div></div><div class="notice success">${icon('check')}<span>Результаты, изученные темы, повторения и черновики сохранены на сервере. Войдите с той же почтой на другом устройстве, чтобы продолжить.</span></div>${ownIdentityFields('account')}<div class="profile-actions"><a class="button outline" href="#/user/${escapeHTML(encodeURIComponent(account.id))}">${icon('user')} Публичный профиль</a><button class="button outline" data-action="export">${icon('download')} Экспорт прогресса</button><button class="button outline" data-action="logout">Выйти ${icon('logout')}</button></div><h2 style="margin-top:30px">История тренировок</h2>${state.attempts.length?state.attempts.slice(0,50).map(s=>`<div class="repeat-row"><span class="repeat-info"><b>${topicForSession(s)?.title||'Тренировка'}</b><small>${languageById(s.language).name} · ${dateLabel(dayKey(s.startedAt))} · отправок: ${s.submissions.length}</small></span><button class="text-link" data-action="download-attempt" data-id="${escapeHTML(s.id)}">Код ${icon('download')}</button></div>`).join(''):'<p class="tiny-empty">Завершённые тренировки появятся здесь.</p>'}<p class="rank-note">Показываем последние 50 тренировок. Скачивание и экспорт включают сохранённый код каждой тренировки. Код посылок доступен вам при отправке и администратору в разделе посылок. Исполнитель проверяет этот код на тестах. В профиле для других участников исходный код не показывается.</p></section><div><section class="card"><h2>Языки программирования</h2><div class="language-list">${LANGUAGES.map(l=>`<div class="language-row"><span>${l.name}</span><span class="badge ${l.priority==='first'?'learned':''}">${l.priority==='first'?'Проверка подключена':'В планах'}</span></div>`).join('')}</div></section><section class="card" style="margin-top:20px"><h2>Правила серии</h2><p class="tiny-empty">Выполните все назначенные повторения за день. Если их нет — хотя бы одну успешную тренировку. За каждые 7 выполненных дней добавляется одна защита. Защиты накапливаются без ограничения. Защита сохраняет серию при пропуске, но не увеличивает её. Дни считаются по Москве.</p></section><section class="card" style="margin-top:20px"><h2>Электронная почта</h2><p class="tiny-empty">${escapeHTML(account.email)}<br>${account.emailVerified?'Адрес подтверждён.':'Адрес ещё не подтверждён.'}</p>${!account.emailVerified?'<button class="button secondary" data-action="send-verification" '+(mailStatus.ready?'':'disabled')+'>Отправить подтверждение</button>':''}${!mailStatus.ready?'<p class="rank-note">'+escapeHTML(mailStatus.message)+'</p>':''}<button class="text-link forgot-link" data-action="forgot-password">Восстановить пароль по почте</button></section></div></div>`;
}
function guide() {
  return intro('Как устроен AlgoGym','')+`<div class="roadmap">${[
    ['01','Изучите тему','Прочитайте объяснение, условие и примеры. Просмотр теории не добавляет тему в изученные.'],
    ['02','Напишите первую реализацию','После теории сразу решите задачу. Тема считается изученной только после прохождения всех тестов.'],
    ['03','Тренируйтесь по памяти','Пустой редактор, непрерывный серверный таймер, C++ и Python. Можно отправлять несколько версий, пока идёт проверка.'],
    ['04','Возвращайтесь вовремя','Повторения: через день, затем через 7, 30, 90 и 180 дней. Ошибки не сдвигают расписание.'],
    ['05','Сравнивайте результаты','Сервер сохраняет время первой правильной отправки. Есть рейтинги скорости, выполненных дней и серий. Друзья появятся позже.'],
    ['06','Различайте цель задания','В алгоритмах нельзя подменять изучаемый приём готовой функцией. В отдельных темах синтаксиса мы специально тренируем библиотечные возможности.'],
  ].map(([n,title,text])=>`<section class="card"><div class="roadmap-number">${n}</div><h3>${title}</h3><p>${text}</p></section>`).join('')}</div><p class="rank-note">Регистрация открыта. Код запускается в изолированной среде. Не включайте в решения пароли и личные данные. Отправка писем заработает после подключения почтового сервиса. Сайт работает на algogym.ru.</p>`;
}
function missing() { return `<div class="card">${empty('search', 'Эта тема ещё не добавлена', 'Откройте библиотеку, чтобы выбрать существующий модуль.', '<button class="button primary" data-action="nav" data-page="catalog">Открыть темы</button>')}</div>`; }
function adminPage() {
  return intro('Администрирование','Посылки, соревнования и данные пользователей.')+'<div id="admin-panel-results">'+adminPanel.render({isAdmin:account?.isAdmin===true})+'</div><div id="admin-competitions-results">'+adminCompetitionsPanel.render({isAdmin:account?.isAdmin===true})+'</div><div id="admin-users-results">'+adminUsersPanel.render({isAdmin:account?.isAdmin===true})+'</div>';
}
function render() {
  if(editorGuard?.isComposing&&route().page==='training'&&editorSessionId===state.active?.id){deferredEditorRender=true;return;}
  const viewKey=JSON.stringify([account?.id,location.hash,authLoading?'loading':emailAction?.kind??(progressError?'error':'app'),route().page==='training'?state.active?.id:null]);
  const viewSnapshot=renderedViewKey===viewKey?captureViewState(app):null;
  renderedViewKey=viewKey;
  try {
  competitionsBinding?.();competitionsBinding=null;
  broadcastBinding?.();broadcastBinding=null;
  dashboardCompetitionsBinding?.();dashboardCompetitionsBinding=null;
  adminBinding?.();adminBinding=null;
  adminUsersBinding?.();adminUsersBinding=null;
  adminCompetitionsBinding?.();adminCompetitionsBinding=null;
  customTestBinding?.();customTestBinding=null;
  editorClipboardBinding?.();editorClipboardBinding=null;
  editorHighlight?.destroy();editorHighlight=null;
  if(editorGuard){editorGuard.reconcile();editorGuard.destroy();editorGuard=null;editorSessionId=null;}
  deferredEditorRender=false;
  if(emailAction){
    if(renderedEmailAction!==emailAction||!document.querySelector('.email-action-card'))app.innerHTML=emailActionScreen(emailAction);
    renderedEmailAction=emailAction;
    document.title=(emailAction.kind==='verify-email'?'Подтверждение почты':'Восстановление пароля')+' — AlgoGym';return;
  }
  renderedEmailAction=null;
  if(authLoading||!account){app.innerHTML=authScreen();return;}
  if(progressError){app.innerHTML=`<main class="auth-layout" id="main"><section class="card auth-card"><h1>Не удалось загрузить прогресс</h1><p>${escapeHTML(progressError)}</p><button class="button primary" data-action="reload-progress">Повторить</button><button class="button outline" data-action="logout">Выйти</button></section></main>`;return;}
  for(const details of document.querySelectorAll('.curriculum-level')){if(details.open)openCourseLevels.add(details.dataset.levelId);else openCourseLevels.delete(details.dataset.levelId);}
  let { page, id } = route();
  if(page==='broadcast'){
    ownerRetests.setVisible([]);
    document.title='Трансляция соревнования — AlgoGym';
    app.innerHTML='<div class="broadcast-screen" id="competition-broadcast"></div>';
    broadcastBinding=competitionBroadcast.bind(document.querySelector('#competition-broadcast'),{id,observer:location.hash.split('/')[3]==='observer'&&account.isAdmin===true});
    return;
  }
  ownerRetests.setVisible(page==='training'&&state.active?state.active.submissions.map(submission=>submission.id):[]);
  if (!['dashboard', 'catalog', 'lesson', 'training', 'reviews', 'rankings', 'user', 'guide', 'admin', 'competitions', 'competition'].includes(page)) page = 'dashboard';
  const titles = { dashboard: 'Мой кабинет', catalog: 'Темы', lesson: topicById(id)?.title || 'Тема', training: 'Тренировка', reviews: 'Повторения', rankings: 'Рейтинги', user: 'Профиль пользователя', guide: 'О проекте', admin: 'Администрирование', competitions: 'Соревнования', competition: 'Соревнование' };
  const nav = [ ['dashboard', 'home', 'Мой кабинет'], ['catalog', 'book', 'Темы'], ['training', 'code', 'Тренировка'], ['reviews', 'repeat', 'Повторения'], ['rankings', 'trophy', 'Рейтинги'], ['competitions', 'duel', 'Соревнования'] ];
  if(account.isAdmin===true)nav.push(['admin','shield','Администрирование']);
  document.title = `${titles[page]} — AlgoGym`;
  const body = ({ dashboard, catalog, lesson: () => lesson(topicById(id)), training, reviews, rankings, user:publicUserPage, guide, admin:adminPage, competitions:()=>'<div id="competitions-results"></div>', competition:()=>'<div id="competitions-results"></div>' })[page]();
  app.innerHTML = `<div class="shell"><div class="mobile-overlay ${menuOpen ? 'open' : ''}" data-action="menu"></div><aside class="sidebar ${menuOpen ? 'open' : ''}" id="sidebar"><button class="brand" data-action="nav" data-page="dashboard" aria-label="AlgoGym, главная"><span class="brand-mark">${icon('code')}</span><span class="brand-name">Algo<span>Gym</span></span></button><nav class="nav" aria-label="Основная навигация">${nav.map(([p, i, title]) => `<a href="#/${p}" class="nav-item ${page === p || (page === 'competition' && p === 'competitions') || (page === 'lesson' && p === 'catalog') ? 'active' : ''}" ${page === p ? 'aria-current="page"' : ''}>${icon(i)}${title}${p === 'reviews' && dueTopics().length ? `<span class="nav-count">${dueTopics().length}</span>` : ''}${p === 'training' && state.active ? '<span class="nav-count">●</span>' : ''}</a>`).join('')}</nav><div class="sidebar-bottom"><a href="#/guide" class="nav-item ${page === 'guide' ? 'active' : ''}">${icon('help')} Как всё устроено</a><section class="sidebar-top-five" id="sidebar-top-five" aria-label="Рейтинг по темам">${topFive()}</section><section class="sidebar-top-five sidebar-streak-top-five" id="sidebar-streak-top-five" aria-label="Рейтинг серии изучений">${streakTopFive()}</section><section class="sidebar-top-five sidebar-competition-top-five" id="sidebar-competition-top-five" aria-label="Рейтинг по соревнованиям">${competitionTopFive()}</section></div></aside><header class="topbar"><div class="breadcrumbs"><button class="mobile-menu" data-action="menu" aria-label="Меню" aria-expanded="${menuOpen}" aria-controls="sidebar">${icon('menu')}</button><span>Моя платформа</span>${icon('chevron')}<b>${escapeHTML(titles[page])}</b></div><div class="top-actions"><span class="top-date">${new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', weekday: 'short' }).format(new Date())}</span><button class="prototype-pill" data-action="scope"><span class="dot"></span> Проверка решений</button></div></header><main id="main" class="workspace" tabindex="-1">${state.active && page !== 'training' ? `<div class="active-banner">${icon('clock')}<span>${state.active.best === null ? `Идёт тренировка «${topicForSession(state.active)?.title || 'Тренировка'}». Таймер продолжает считать.` : `Решение «${topicForSession(state.active)?.title || 'Тренировка'}» проверено. Время первой верной отправки: ${formatTime(state.active.best)}.`}</span><button class="text-link" data-action="nav" data-page="training">Вернуться ${icon('arrow')}</button></div>` : ''}${!storageAvailable ? `<div class="notice" style="margin-bottom:20px">${icon('info')}<span>Резервная копия черновика в браузере недоступна. Проверяйте отметку сохранения на сервере.</span></div>` : ''}${body}<footer class="footer"><span>© ${new Date().getFullYear()} AlgoGym</span><button data-action="scope">О платформе ${icon('chevron')}</button></footer></main></div>`;
  if(page==='dashboard')dashboardCompetitionsBinding=dashboardCompetitions.bind(document.querySelector('#dashboard-competitions'),{accountId:account.id});
  if (page === 'training' && state.active && document.querySelector('#code-input')) {bindEditor();refreshTrainingMetadata();}
  if(page==='admin'){
    adminUsersBinding=adminUsersPanel.bind(document.querySelector('#admin-users-results'),{getIsAdmin:()=>account?.isAdmin===true});
    adminBinding=adminPanel.bind(document.querySelector('#admin-panel-results'),{getIsAdmin:()=>account?.isAdmin===true});
    adminCompetitionsBinding=adminCompetitionsPanel.bind(document.querySelector('#admin-competitions-results'),{getIsAdmin:()=>account?.isAdmin===true});
  }
  if(page==='competitions'||page==='competition')competitionsBinding=competitionsPanel.bind(document.querySelector('#competitions-results'),{id:page==='competition'?id:null});
  if (page === 'rankings') loadLeaderboard();
  if (page === 'user') loadPublicUser();
  loadTopFive();
  loadStreakTopFive();
  loadCompetitionTopFive();
  } finally {
    if(viewSnapshot){restoreViewState(app,viewSnapshot);editorHighlight?.refresh();}
  }
}
function scopeDialog() {
  openDialog(`<div class="dialog-symbol">${icon('spark')}</div><h2 id="modal-title">Что уже работает</h2><ul class="dialog-points"><li>${icon('user')}<span>Вход по почте и паролю. Серверный профиль, прогресс, расписание и черновики.</span></li><li>${icon('code')}<span>${TOPICS.length} тем, реальные тесты C++ и Python, таймер и время первой верной отправки.</span></li><li>${icon('trophy')}<span>Общие рейтинги скорости, дней и серий; ограничения готовых функций по цели задания.</span></li></ul><p>Подтверждение почты и восстановление пароля готовы к подключению отправителя. Сайт доступен на algogym.ru. Друзья — следующий шаг.</p><div class="dialog-actions"><button class="button primary" data-action="close-dialog">Понятно</button></div>`);
}
function bindEditor() {
  const editor=document.querySelector('#code-input'),sessionId=state.active.id;
  for(const element of document.querySelectorAll('#code-input,#code-highlight,#line-numbers,.custom-test-panel textarea'))element.setAttribute('data-scroll-key',sessionId+':'+element.id);
  editorSessionId=sessionId;
  if(editorClipboardKey!==sessionId){editorClipboardPanel.clear();editorClipboardKey=sessionId;}
  editorGuard=attachEditorGuard(editor,{
    internalClipboard:editorClipboardPanel.storageFor(sessionId),sessionKey:sessionId,
    language:state.active.language,
    maxLength:100000,
    onBlock:reason=>toast(reason==='max-length'?'Лимит редактора: 100 000 символов.':reason==='composition-active'?'Завершите ввод символа перед отправкой.':'Подстановка текста заблокирована. Набирайте код самостоятельно.'),
    onChange:value=>{
      if(state.active?.id!==sessionId)return;
      state.active.code=value;state.active.draftDirty=true;
      customTestRunner.codeChanged(sessionId);
      document.querySelector('#line-numbers').textContent=lineNumbers(value);
      editorHighlight?.refresh();
      document.querySelector('#character-count').textContent=value.length+' символов · сохраняем черновик…';
      save();scheduleDraft();
    },
  });
  editor.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelector('#editor-language').focus();});
  editor.addEventListener('compositionend',()=>{if(deferredEditorRender)queueMicrotask(()=>{if(editor.isConnected)render();});});
  editorHighlight=attachCodeHighlight(editor,{layer:document.querySelector('#code-highlight'),numbers:document.querySelector('#line-numbers'),language:state.active.language});
  const clipboardPanel=document.querySelector('.editor-clipboard-panel');
  if(clipboardPanel)editorClipboardBinding=editorClipboardPanel.bind(clipboardPanel,{
    sessionId,editor,guard:editorGuard,
    available:()=>Boolean(account&&state.active?.id===sessionId&&state.active.endedAt===null&&!draftConflicts.has(sessionId)),
  });
  const customPanel=document.querySelector('.custom-test-panel');
  if(customPanel)customTestBinding=customTestRunner.bind(customPanel,{
    sessionId,getCode:()=>state.active?.id===sessionId?state.active.code:'',
    available:()=>Boolean(account&&state.active?.id===sessionId&&state.active.server&&state.active.endedAt===null&&!topicForSession(state.active)?.archived&&(state.active.taskVersion??1)>=(topicById(state.active.topic)?.taskVersion??1)),
    beforeRun:()=>{
      if(!editorGuard?.reconcile({submit:true}))return false;
      if(draftConflicts.has(sessionId)){toast('Сначала выберите версию черновика.');return false;}
      return true;
    },
  });
}

function localSession(id) { return state.active?.id === id ? state.active : state.attempts.find(s=>s.id===id); }
function putSession(session) {
  if (state.active?.id === session.id) state.active=session;
  else {const i=state.attempts.findIndex(s=>s.id===session.id);if(i>=0)state.attempts[i]=session;}
}
function receiveServerResult(payload) {
  if (payload.serverNow) clockOffset=payload.serverNow-Date.now();
  const local=localSession(payload.session.id); if(!local)return;
  const merged=mergeServerSession(local,payload.session),lostAcceptance=local.best!==null&&merged.best===null;
  // Unchanged polls must not starve a slow progress request. A new accepted result
  // or record revision does invalidate projections prepared before that update.
  if(merged.best!==local.best || (merged.personalRecord?.revision??0)>(local.personalRecord?.revision??0)){progressRequest++;invalidateOwnPublicProfile();}
  if((payload.session.draftRevision??0)>(local.draftRevision??0)) {
    if(local.draftDirty)draftConflicts.set(merged.id,payload.session);
    else {merged.code=payload.session.code;merged.draftRevision=payload.session.draftRevision;}
  }
  for (const s of merged.submissions) if (!s.confirmed && ['pending','delivery_unknown'].includes(s.status) && payload.serverNow-s.submittedAt>120000) {s.status='rejected';s.message='Сервер не подтвердил получение этой версии. Отправьте решение заново.';}
  putSession(merged);
  const recordToast=observePersonalRecords();
  if(route().page==='training'&&state.active?.id===merged.id&&(merged.code!==local.code||draftConflicts.has(merged.id)||lostAcceptance))render();
  if(lostAcceptance)syncProgress({redraw:route().page!=='training'}).catch(error=>toast('Обновите прогресс после восстановления связи: '+error.message));
  if (merged.best !== null && merged.best !== local.best) {
    if(route().page!=='rankings'){rankingTopic=topicById(merged.topic)?.id||topicForSession(merged)?.replacementTopic||'dijkstra';rankingLanguage='all';}
    leaderboardState.key=null;if(route().page==='rankings')loadLeaderboard(true);loadTopFive(true);loadStreakTopFive(true);loadCompetitionTopFive(true);
  }
  if (merged.best !== null && !merged.completed) {
    merged.completed=true;
    syncProgress({redraw:route().page!=='training'}).catch(error=>toast('Решение принято. Расписание обновится после восстановления связи: '+error.message));
    if(!recordToast)toast('Решение прошло все тесты! Первая верная отправка: '+formatTime(merged.best));
  }
  save();refreshSubmissions();
  refreshTrainingMetadata();
}
async function deliverSubmission(sessionId, submission) {
  const generation=accountGeneration;
  try {
    const result=await postServerSubmission(sessionId,submission.clientId || submission.id,submission.code);
    if(generation!==accountGeneration)return;
    receiveServerResult(result);
  } catch(error) {
    if(generation!==accountGeneration)return;
    const session=localSession(sessionId);if(!session)return;
    const item=session.submissions.find(s=>(s.clientId || s.id)===(submission.clientId || submission.id));
    if(item&&!item.confirmed){item.status=error.status>=400&&error.status<500?'rejected':'delivery_unknown';item.message=error.message;}
    save();refreshSubmissions();toast(error.message);
  }
}
async function sendCode() {
  if(editorGuard&&!editorGuard.reconcile({submit:true}))return;
  if (!state.active) return;
  if (!state.active.server) {toast('Начните новую тренировку: для этой попытки ещё не был запущен серверный таймер.');return;}
  let submission;
  try{submission=snapshotSubmission(state.active,Date.now()+clockOffset);}catch(error){toast(error.message);return;}
  submission.clientId=submission.id;
  state.active.submissions.push(submission);save();refreshSubmissions();
  await deliverSubmission(state.active.id,submission);
}
async function retrySubmission(clientId) {
  const session=state.active;if(!session?.server)return;
  const submission=session.submissions.find(s=>(s.clientId||s.id)===clientId);
  if(!submission||submission.status!=='delivery_unknown')return;
  submission.status='pending';submission.message='Повторно подтверждаем доставку той же версии…';save();refreshSubmissions();
  await deliverSubmission(session.id,submission);
}
async function pollSession(id) {
  if(pollingSessions.has(id))return;
  const generation=accountGeneration;
  pollingSessions.add(id);
  try{const result=await getServerSession(id);if(generation===accountGeneration)receiveServerResult(result);}
  catch(error){if(generation===accountGeneration&&error.status===404){const s=localSession(id);if(s){s.server=false;save();}}}
  finally{pollingSessions.delete(id);}
}
async function connectJudge() {
  const generation=accountGeneration;
  try{const result=await getJudgeStatus();if(generation!==accountGeneration)return;judgeStatus=result;}
  catch(error){judgeStatus={ready:false,languages:[],message:error.message};}
  if(state.active?.server)await pollSession(state.active.id);
}
setInterval(()=>{
  const sessions=[state.active,...state.attempts].filter(s=>s?.server&&s.submissions.some(x=>['pending','delivery_unknown'].includes(x.status))).slice(0,4);
  for(const s of sessions)pollSession(s.id);
},2000);

function refreshSubmissions() {
  const list = document.querySelector('#submission-list');
  if (!list || !state.active) return;
  replaceViewHTML(list,submissionList(state.active));
  list.parentElement.querySelector('h2').innerHTML = `Отправки <span class="muted">· ${state.active.submissions.length}</span>`;
}
function download(filename, text, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.addEventListener('click', async event => {
  const trigger = event.target.closest('[data-action]'); if (!trigger) return;
  const { action, id, page, value } = trigger.dataset;
  if(action==='forgot-password')openDialog(forgotPasswordForm(mailStatus.ready,mailStatus.message,account?.email||''));
  else if(action==='leave-email-action'){emailAction=null;navigate('dashboard');}
  else if(action==='send-verification'){
    const generation=accountGeneration;trigger.disabled=true;
    try{const result=await requestEmailVerification();if(generation===accountGeneration)toast(result.message||'Письмо подтверждения отправлено.');}catch(error){if(generation===accountGeneration)toast(error.message);}finally{if(trigger.isConnected)trigger.disabled=false;}
  }
  else if(action==='auth-mode'){authMode=value;authError='';render();}
  else if(action==='logout'){
    const generation=accountGeneration;
    try{await flushDraft();if(generation!==accountGeneration)return;await logoutAccount();if(generation!==accountGeneration)return;clearAccount();authLoading=false;render();toast('Вы вышли из аккаунта.');}catch(error){if(generation===accountGeneration)toast(error.message);}
  }
  else if(action==='reload-progress'){try{await syncProgress();}catch(error){toast(error.message);}}
  else if(action==='draft-use-server'||action==='draft-use-mine'){
    const session=state.active,canonical=session&&draftConflicts.get(session.id);if(!canonical)return;
    session.draftRevision=canonical.draftRevision;
    if(action==='draft-use-server'){session.code=canonical.code;session.draftDirty=false;}
    draftConflicts.delete(session.id);save();render();if(session.draftDirty)flushDraft().catch(error=>toast(error.message));
  }
  else if (action === 'nav') navigate(page);
  else if (action === 'study') navigate('lesson', id);
  else if(action==='show-curriculum')document.querySelector('#curriculum')?.scrollIntoView({behavior:'smooth',block:'start'});
  else if (action === 'train') trainingDialog(id);
  else if (action === 'close-dialog') closeDialog();
  else if (action === 'confirm-start') startTraining(id, document.querySelector('#start-language').value);
  else if (action === 'scope') scopeDialog();
  else if (action === 'theory-read') markRead(id);
  else if (action === 'category') { category = trigger.dataset.category; render(); }
  else if (action === 'study-status') { studyStatus = trigger.dataset.value; render(); }
  else if (action === 'reset-search') { category = 'Все темы'; query = ''; level = 'Все уровни'; studyStatus = 'all'; render(); }
  else if (action === 'refresh-ranking') {loadLeaderboard(true);loadTopFive(true);loadStreakTopFive(true);loadCompetitionTopFive(true);}
  else if(action==='overall-ranking'){rankingType='overall';rankingScope='all';navigate('rankings');}
  else if(action==='streak-ranking'){rankingType='streak';streakSort='series';rankingScope='all';navigate('rankings');}
  else if(action==='competition-ranking'){rankingType='competition';rankingScope='all';navigate('rankings');}
  else if(action==='public-profile-ranking')openPublicProfileRanking(value);
  else if(action==='refresh-streak-top-five')loadStreakTopFive(true);
  else if(action==='refresh-competition-top-five')loadCompetitionTopFive(true);
  else if(action==='refresh-user-profile')loadPublicUser(true);
  else if (action === 'rank-type') { rankingType = value; render(); }
  else if (action === 'rank-scope') { rankingScope = value; render(); }
  else if (action === 'submit-code') sendCode();
  else if (action === 'retry-submission') retrySubmission(id);
  else if (action === 'retest-submission') void ownerRetests.run(id);
  else if (action === 'menu') { menuOpen = !menuOpen; document.querySelector('.sidebar').classList.toggle('open', menuOpen); document.querySelector('.mobile-overlay').classList.toggle('open', menuOpen); document.querySelector('.mobile-menu').setAttribute('aria-expanded', menuOpen); }
  else if (action === 'download-code') { if(editorGuard&&!editorGuard.reconcile({submit:true}))return; if (state.active) download(`${state.active.topic}.${languageById(state.active.language).extension}`, state.active.code); }
  else if (action === 'download-attempt') { const attempt = state.attempts.find(x => x.id === id); if (attempt) download(`${attempt.topic}.${languageById(attempt.language).extension}`, attempt.code); }
  else if (action === 'export') download(`algopraktika-${today()}.json`, JSON.stringify(state, null, 2), 'application/json');
  else if (action === 'end-session') openDialog(`<h2 id="modal-title">Завершить тренировку?</h2><p>Код и отправки останутся в истории профиля. При следующем старте редактор будет пустым, а отсчёт начнётся заново.</p><div class="dialog-actions"><button class="button outline" data-action="close-dialog">Продолжить писать</button><button class="button primary" data-action="confirm-end">Завершить</button></div>`);
  else if (action === 'confirm-end') { const generation=accountGeneration,sessionId=state.active?.id;try{await flushDraft();if(generation!==accountGeneration||state.active?.id!==sessionId)return;await endServerSession(sessionId);if(generation!==accountGeneration)return;state.active=null;closeDialog();await syncProgress();if(generation===accountGeneration)navigate('dashboard');}catch(error){if(generation===accountGeneration)toast(error.message);} }
  else if (action === 'confirm-language') { const language = trigger.dataset.language; const topic = state.active?.topic; if (topic) { startRequestId = crypto.randomUUID(); startTraining(topic, language); } }
});
document.addEventListener('submit', async event => {
  const form=event.target;
  if(!['auth-form','forgot-password-form','verify-email-form','reset-password-form'].includes(form.id))return;
  event.preventDefault();const button=form.querySelector('button[type="submit"]');button.disabled=true;
  const fields=new FormData(form);
  try {
    if(form.id==='forgot-password-form'){
      const result=await requestPasswordReset(fields.get('email'));if(!form.isConnected||!modal.open)return;openDialog('<h2 id="modal-title">Проверьте почту</h2><p>'+escapeHTML(result.message)+'</p><div class="dialog-actions"><button class="button primary" data-action="close-dialog">Понятно</button></div>');
    }else if(form.id==='verify-email-form'){
      const submittedAction=emailAction,token=submittedAction?.token;if(!token)throw new Error('Откройте ссылку из письма ещё раз.');
      await confirmEmailVerification(token);
      if(emailAction!==submittedAction)return;
      emailAction={...submittedAction,token:null,done:true};render();
      const generation=accountGeneration;
      getAccount().then(current=>{if(generation===accountGeneration&&current.user?.id===account?.id){account=current.user;render();}}).catch(()=>{});
    }else if(form.id==='reset-password-form'){
      const submittedAction=emailAction,token=submittedAction?.token,password=fields.get('password'),generation=accountGeneration;if(!token)throw new Error('Откройте ссылку из письма ещё раз.');
      if(password!==fields.get('repeat'))throw new Error('Пароли не совпадают.');
      if(new TextEncoder().encode(password).length>72)throw new Error('Пароль слишком длинный. Используйте до 72 латинских или примерно 36 русских символов.');
      save();await resetPassword(token,password);form.reset();if(generation===accountGeneration){clearAccount();authLoading=false;}
      if(emailAction===submittedAction)emailAction={kind:'reset-password',token:null,done:true};render();
    }else if(form.id==='auth-form') {
      const signup=authMode==='register', password=fields.get('password');
      if(signup&&password!==fields.get('repeat'))throw new Error('Пароли не совпадают.');
      if(signup&&new TextEncoder().encode(password).length>72)throw new Error('Пароль слишком длинный: используйте до 72 латинских или примерно 36 русских символов.');
      const values={email:fields.get('email'),password,...(signup?{displayName:fields.get('displayName'),firstName:fields.get('firstName'),lastName:fields.get('lastName'),linkLegacy:fields.get('linkLegacy')==='on'}:{})};
      const result=signup?await registerAccount(values):await loginAccount(values);
      form.reset();authError='';await useAccount(result,{linked:signup&&values.linkLegacy});
      toast(signup?(result.mailDelivery?.message||'Аккаунт создан. Добро пожаловать!'):'Вы вошли в аккаунт.');
    }
  }catch(error){const box=document.querySelector(form.id==='auth-form'?'#auth-error':form.id==='forgot-password-form'?'#forgot-error':'#email-action-error');if(box)box.textContent=error.message;}
  finally{if(button.isConnected)button.disabled=false;}
});

document.addEventListener('input', event => {
  if (event.target.id === 'topic-search') { query = event.target.value; updateCatalogResults(); }
});
document.addEventListener('change', event => {
  if (event.target.id === 'level-filter') { level = event.target.value; updateCatalogResults(); }
  else if (event.target.id === 'streak-sort') { streakSort=event.target.value; loadLeaderboard(true); }
  else if (event.target.id === 'ranking-topic') { rankingTopic = event.target.value; loadLeaderboard(true); }
  else if (event.target.id === 'ranking-language') { rankingLanguage = event.target.value; loadLeaderboard(true); }
  else if (event.target.id === 'editor-language' && state.active) {
    const language = event.target.value; event.target.value = state.active.language;
    if (language === state.active.language) return;
    openDialog(`<h2 id="modal-title">Начать на ${languageById(language).name}?</h2><p>Смена языка начинает новую тренировку с пустым редактором и новым таймером. Текущий код останется в истории.</p><div class="dialog-actions"><button class="button outline" data-action="close-dialog">Остаться</button><button class="button primary" data-action="confirm-language" data-language="${language}">Начать заново</button></div>`);
  }
});
window.addEventListener('hashchange', () => { const captured=captureEmailAction(location,history);emailAction=captured;menuOpen = false; render(); document.querySelector('#main')?.focus({ preventScroll: true }); window.scrollTo(0, 0); });
window.addEventListener('storage', event => { if (event.key === storageKey&&account&&hasChangedActiveDraft(event.oldValue,event.newValue,state.active)) toast('Черновик изменился в другой вкладке. При сохранении проверим, что версии не конфликтуют.'); });
window.addEventListener('account-expired',()=>{if(account){save();clearAccount();authLoading=false;authError='Войдите снова, чтобы продолжить.';render();}});
document.addEventListener('visibilitychange', () => { if(document.visibilityState==='visible'&&account)syncProgress({redraw:route().page!=='training'}).catch(()=>{}); });
setInterval(()=>{if(account&&document.visibilityState==='visible'&&!modal.open)syncProgress({redraw:route().page!=='training'}).catch(()=>{});},30000);
setInterval(() => {
  const session=state.active,timer=document.querySelector('#live-timer');
  if(timer&&session)timer.textContent=formatTime(session.best??Date.now()+clockOffset-session.startedAt);
  const label=document.querySelector('#personal-record-comparison');
  if(label&&session){const comparison=recordComparison(session.personalRecord,Date.now()+clockOffset-session.startedAt);label.textContent=comparison.text;label.className='record-comparison '+comparison.tone;}
}, 100);
render();
bootstrapAccount();
