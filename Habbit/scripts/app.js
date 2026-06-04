'use strict';

let habbits = [];
const HABBIT_KEY = 'HABBIT_KEY';
let globalActiveHabbitId;

/* page */
const page = {
    menu: document.querySelector('.menu__list'),
    header: {
        h1: document.querySelector('.h1'),
        progressPersent: document.querySelector('.progress__percent'),
        progressCoverBar: document.querySelector('.progress__cover-bar')
    },
    content: {
        daysContainer: document.getElementById('days'),
        nextDay: document.querySelector('.habbit__day')
    },
    popup: {
        index: document.getElementById('add-habbit-popup'),
        iconField: document.querySelector('.popup__form input[name="icon"]')
    }
}

/* utils */
function loadData() {
    const habbitsString = localStorage.getItem(HABBIT_KEY);
    if (!habbitsString) return;
    try {
        const habbitArray = JSON.parse(habbitsString);
        if (Array.isArray(habbitArray)) {
            habbits = habbitArray;
        }
    } catch (e) {
        console.warn('Не удалось прочитать HABBIT_KEY из localStorage', e);
        habbits = [];
    }
}


function saveData() {
    localStorage.setItem(HABBIT_KEY, JSON.stringify(habbits));
}

function togglePopup() {
    if (page.popup.index.classList.contains('cover_hidden')) {
        page.popup.index.classList.remove('cover_hidden');
    } else {
        page.popup.index.classList.add('cover_hidden');
    }
}

function resetForm(form, fields) {
    for (const field of fields) {
        form[field].value = '';
    }
}

function validateAndGetFormData(form, fields) {
    const formData = new FormData(form);
    const res = {};
    for (const field of fields) {
        const fieldValue = formData.get(field);
        form[field].classList.remove('error')
        if (!fieldValue) {
            form[field].classList.add('error');
        }
        res[field] = fieldValue;
    }
    let isValid = true;
    for (const field of fields) {
        if (!res[field]) {
            isValid = false;
        }
    }
    if (!isValid) {
        return;
    }
    return res;
}

/* render */
function rerenderMenu(activeHabbit) {
    // очищаем меню полностью и создаём кнопки заново — это гарантирует, что удалённые элементы исчезнут сразу
    page.menu.innerHTML = '';

    for (const habbit of habbits) {
        const element = document.createElement('button');
        element.setAttribute('menu-habbit-id', habbit.id);
        element.classList.add('menu__item');
        element.innerHTML = `<img alt="${habbit.name}" src="/Habbit/images/${habbit.icon}.svg"/>`;

        // левый клик — выбираем привычку
        element.addEventListener('click', () => rerender(habbit.id));

        // правый клик — показываем popup "Удалить привычку"
        element.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            const popup = document.getElementById('delete-popup');
            if (!popup) return;

            // позиционируем popup, корректируем чтобы не вылез за край
            popup.style.display = 'block';
            // надо получить размеры после того как сделали display:block
            const popupRect = popup.getBoundingClientRect();
            let left = event.pageX;
            let top = event.pageY;
            const maxLeft = window.pageXOffset + document.documentElement.clientWidth - popupRect.width - 10;
            const maxTop = window.pageYOffset + document.documentElement.clientHeight - popupRect.height - 10;
            if (left > maxLeft) left = Math.max(10, maxLeft);
            if (top > maxTop) top = Math.max(10, maxTop);

            popup.style.left = left + 'px';
            popup.style.top = top + 'px';

            // назначаем действие удаления для этой конкретной кнопки
            popup.onclick = (e) => {
                e.stopPropagation();
                deleteHabbit(habbit.id);
                popup.style.display = 'none';
            };
        });

        // помечаем активную
        if (activeHabbit && activeHabbit.id === habbit.id) {
            element.classList.add('menu__item_active');
        }

        page.menu.appendChild(element);
    }
}


function rerenderHead(activeHabbit) {
    page.header.h1.innerText = activeHabbit.name;
    const progress = activeHabbit.days.length / activeHabbit.target > 1
        ? 100
        :activeHabbit.days.length / activeHabbit.target * 100;

    page.header.progressPersent.innerText = progress.toFixed(0) + '%';
    page.header.progressCoverBar.setAttribute('style', `width: ${progress}%`);
}

function rerenderContent(activeHabbit) {
    page.content.daysContainer.innerHTML = '';
    for (const index in activeHabbit.days) {
        const element = document.createElement('div');
        element.classList.add('habbit');
        element.innerHTML = `<div class="habbit__day">День ${Number(index) + 1}</div>
                        <div class="habbit__comment">${activeHabbit.days[index].comment}</div>
                        <button class="habbit__delete" onclick="deleteDay(${index})">
                            <img src="/Habbit/images/delete.svg" alt="Удалить день ${Number(index) + 1}">
                        </button>`;
        page.content.daysContainer.appendChild(element);
    }
    page.content.nextDay.innerHTML = `День ${activeHabbit.days.length + 1}`;  
}

function rerender(activeHabbitId) {
    globalActiveHabbitId = activeHabbitId;
    const activeHabbit = habbits.find(habbit => habbit.id === activeHabbitId);
    if (!activeHabbit) {
        return;
    }
    document.location.replace(document.location.pathname + "#" + activeHabbitId);
    rerenderMenu(activeHabbit);
    rerenderHead(activeHabbit);
    rerenderContent(activeHabbit);
}

/* work with days */
function addDays(event) {
    event.preventDefault();
    const data = validateAndGetFormData(event.target, ['comment']);
    if (!data) {
        return;
    }

    habbits = habbits.map(habbit => {
        if (habbit.id === globalActiveHabbitId) {
            return {
                ...habbit,
                days: habbit.days.concat([{ comment: data.comment }])
            }
        }
        return habbit;
    });
    resetForm(event.target, ['comment']);
    rerender(globalActiveHabbitId);
    saveData();
}

function deleteDay(index) {
    habbits = habbits.map(habbit => {
        if (habbit.id === globalActiveHabbitId) {
            habbit.days.splice(index, 1);
            return {
                ...habbit,
                days: habbit.days
            };
        }
        return habbit;
    });
    rerender(globalActiveHabbitId);
    saveData();
}

function deleteHabbit(id) {
    habbits = habbits.filter(habbit => habbit.id !== id);
    saveData();

    if (habbits.length > 0) {
        rerender(habbits[0].id);
    } else {
        // если ни одной привычки не осталось — очищаем UI
        page.menu.innerHTML = '';
        page.header.h1.innerText = 'Нет привычек';
        page.header.progressPersent.innerText = '0%';
        page.header.progressCoverBar.setAttribute('style', 'width: 0%');
        page.content.daysContainer.innerHTML = '';
        page.content.nextDay.innerHTML = 'День _';
        // очистим хеш в URL
        history.replaceState(null, '', document.location.pathname);
    }
}

/* working with habbits */
function setIcon(context, icon) {
    page.popup.iconField.value = icon;
    const activeIcon = document.querySelector('.icon.icon_active');
    activeIcon.classList.remove('icon_active');
    context.classList.add('icon_active');
}

function addHabbit(event) {
    event.preventDefault();
    const data = validateAndGetFormData(event.target, ['name', 'icon', 'target']);
    if (!data) {
        return;
    }
    const maxId = habbits.reduce((acc, habbit) => acc > habbit.id ? acc : habbit.id, 0);
    const newHabbit = {
        id: maxId + 1,
        name: data.name,
        target: data.target,
        icon: data.icon,
        days: []
    };
    habbits.push(newHabbit);

    saveData(); // <--- важно: сохраняем сразу после добавления

    resetForm(event.target, ['name', 'target']);
    togglePopup();
    rerender(newHabbit.id);
}

document.addEventListener('click', () => {
    const popup = document.getElementById('delete-popup');
    if (popup) popup.style.display = 'none';
});

/* init */
(() => {
    loadData();
    const hashId = Number(document.location.hash.replace('#', ''));
    const urlHabbit = habbits.find(habbit => habbit.id == hashId);
    if (urlHabbit) {
        rerender(urlHabbit.id);
    } else {
        rerender(habbits[0].id);
    }
})();