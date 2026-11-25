const $ = (id) => document.getElementById(id);
const today = new Date();
const dateKey = (date) => [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
let events = read("folio_calendar_events");
let tasks = read("folio_calendar_tasks");
let current = new Date(today.getFullYear(), today.getMonth(), 1);
let editingEvent = null;
let visibleCategories = ["Personal","Work","Other"];

function persist(){localStorage.setItem("folio_calendar_events",JSON.stringify(events));localStorage.setItem("folio_calendar_tasks",JSON.stringify(tasks));}
function categoryClass(category){return category==="Work"?"work":category==="Other"?"other":"";}
function renderCalendar(){
  $("monthLabel").textContent = current.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const first = new Date(current.getFullYear(),current.getMonth(),1);
  const start = new Date(first); start.setDate(1-first.getDay());
  const grid = $("calendarGrid"); grid.innerHTML = "";
  for(let i=0;i<42;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    const key=dateKey(d), dayEvents=events.filter(e=>e.date===key&&visibleCategories.includes(e.category)).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
    const cell=document.createElement("div"); cell.className="calendar-day"+(d.getMonth()!==current.getMonth()?" outside":"")+(key===dateKey(today)?" today":"");
    const number=document.createElement("div"); number.className="day-number"; number.textContent=d.getDate(); cell.append(number);
    dayEvents.slice(0,3).forEach(e=>{const chip=document.createElement("button");chip.className="event-chip "+categoryClass(e.category);chip.textContent=(e.time?e.time+" ":"")+e.title;chip.title="Edit "+e.title;chip.addEventListener("click",()=>openEvent(e.id));cell.append(chip);});
    if(dayEvents.length>3){const more=document.createElement("div");more.className="more-events";more.textContent="+"+(dayEvents.length-3)+" more";cell.append(more);}
    cell.addEventListener("dblclick",()=>openEvent(null,key));grid.append(cell);
  }
  renderUpcoming();
}
function renderUpcoming(){
  const start=dateKey(today), list=events.filter(e=>e.date>=start&&visibleCategories.includes(e.category)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,6);
  $("upcomingRange").textContent=list.length?"Next events":"";
  const root=$("upcomingList");root.innerHTML="";
  if(!list.length){root.innerHTML='<div class="empty-state">No upcoming events. Create one to get started.</div>';return;}
  list.forEach(e=>{const d=new Date(e.date+"T00:00:00");const item=document.createElement("button");item.className="upcoming-item";item.style.textAlign="left";item.style.cursor="pointer";item.innerHTML='<span class="event-line '+categoryClass(e.category)+'"></span><span class="upcoming-date"><strong>'+d.getDate()+'</strong><span>'+d.toLocaleDateString("en-US",{month:"short"})+'</span></span><span class="upcoming-info"><strong></strong><span></span></span>';item.querySelector(".upcoming-info strong").textContent=e.title;item.querySelector(".upcoming-info span").textContent=[e.time,e.category].filter(Boolean).join(" · ");item.addEventListener("click",()=>openEvent(e.id));root.append(item);});
}
function openEvent(id=null,date=dateKey(today)){
  editingEvent=id;const e=events.find(x=>x.id===id);
  $("eventForm").reset();$("eventDialogTitle").textContent=e?"Edit event":"New event";
  $("eventTitle").value=e?.title||"";$("eventDate").value=e?.date||date;$("eventTime").value=e?.time||"09:00";$("eventCategory").value=e?.category||"Personal";$("eventNotes").value=e?.notes||"";
  $("deleteEventButton").classList.toggle("hidden",!e);$("eventDialog").showModal();$("eventTitle").focus();
}
$("eventForm").addEventListener("submit",e=>{e.preventDefault();const item={id:editingEvent||crypto.randomUUID(),title:$("eventTitle").value.trim(),date:$("eventDate").value,time:$("eventTime").value,category:$("eventCategory").value,notes:$("eventNotes").value.trim()};if(!item.title||!item.date)return;if(editingEvent)events=events.map(x=>x.id===editingEvent?item:x);else events.push(item);persist();$("eventDialog").close();renderCalendar();});
$("deleteEventButton").addEventListener("click",()=>{if(!editingEvent)return;events=events.filter(e=>e.id!==editingEvent);persist();$("eventDialog").close();renderCalendar();});
function renderTasks(){ $("taskCount").textContent=tasks.filter(t=>!t.done).length;const root=$("taskList");root.innerHTML="";if(!tasks.length){root.innerHTML='<div class="empty-state">No tasks yet. Add your first task.</div>';return;}tasks.sort((a,b)=>(a.date||"9999").localeCompare(b.date||"9999")).forEach(t=>{const row=document.createElement("div");row.className="task-row"+(t.done?" done":"");const check=document.createElement("input");check.type="checkbox";check.checked=t.done;check.setAttribute("aria-label","Complete "+t.title);check.addEventListener("change",()=>{t.done=check.checked;persist();renderTasks();});const label=document.createElement("label");label.textContent=t.title;const due=document.createElement("span");due.className="task-due";due.textContent=t.date||"No due date";const del=document.createElement("button");del.className="text-button danger";del.textContent="×";del.setAttribute("aria-label","Delete task");del.addEventListener("click",()=>{tasks=tasks.filter(x=>x.id!==t.id);persist();renderTasks();});row.append(check,label,due,del);root.append(row);});}
$("taskForm").addEventListener("submit",e=>{e.preventDefault();const title=$("taskTitle").value.trim();if(!title)return;tasks.push({id:crypto.randomUUID(),title,date:$("taskDate").value,done:false});persist();$("taskDialog").close();$("taskForm").reset();renderTasks();});
function showView(view){const isTasks=view==="tasks";$("calendarView").classList.toggle("hidden",isTasks);$("tasksView").classList.toggle("hidden",!isTasks);$("pageTitle").textContent=isTasks?"Tasks":"Calendar";document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));if(isTasks)renderTasks();}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$("prevMonth").addEventListener("click",()=>{current.setMonth(current.getMonth()-1);renderCalendar();});
$("nextMonth").addEventListener("click",()=>{current.setMonth(current.getMonth()+1);renderCalendar();});
function goToday(){current=new Date(today.getFullYear(),today.getMonth(),1);renderCalendar();}
$("todayButton").addEventListener("click",goToday);$("toolbarToday").addEventListener("click",goToday);
$("addEventButton").addEventListener("click",()=>openEvent());$("addTaskButton").addEventListener("click",()=>{$("taskForm").reset();$("taskDialog").showModal();});
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.close).close()));
document.querySelectorAll("[data-category]").forEach(c=>c.addEventListener("change",()=>{visibleCategories=c.checked?[...visibleCategories,c.dataset.category]:visibleCategories.filter(x=>x!==c.dataset.category);renderCalendar();}));
$("searchButton").addEventListener("click",()=>{$("searchDialog").showModal();$("searchInput").value="";$("searchResults").innerHTML="";$("searchInput").focus();});
$("searchInput").addEventListener("input",()=>{const q=$("searchInput").value.trim().toLowerCase();const root=$("searchResults");root.innerHTML="";if(!q)return;const matches=[...events.map(e=>({title:e.title,meta:e.date+" · Event"})),...tasks.map(t=>({title:t.title,meta:(t.date||"No due date")+" · Task"}))].filter(x=>x.title.toLowerCase().includes(q));if(!matches.length){root.textContent="No results found.";return;}matches.forEach(m=>{const row=document.createElement("div");row.className="search-result";const strong=document.createElement("strong");strong.textContent=m.title;const small=document.createElement("div");small.className="muted";small.textContent=m.meta;row.append(strong,small);root.append(row);});});
$("menuButton").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
renderCalendar();renderTasks();