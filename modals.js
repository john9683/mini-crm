// глобальные константны всех модальных окон
const
  $modal = document.getElementById("modals"),
  $errorWrap = document.createElement("div"),
  $modalBtnWrap = document.createElement("div"),
  $modalAddBtn = document.createElement("button"),
  $modalCanselBtnForAdd = document.createElement("div"), // кнопка Отмена для модалки Добавить - в отличии от закрытия кликом по Х стирает данные в инпутах
  $modalCanselBtnForDelete = document.createElement("div"), // кнопка Отмена для модалки Удалить
  $modalChangeBtn = document.createElement("button"),
  $modalDeleteBtn = document.createElement("button"),
  $modalChangeBtnDelete = document.createElement("div"), // кнопка удалить на модалке редактирования данных
  notFound = "не найдено",
  $modalBlockContacts = document.createElement("div"), // глобальная обёртка для всего блока контактов
  $modalWrapContactAddBtn = document.createElement("div"), // обёртка для кнопки добавления нового селекта+инпута контактов - функция createContactsBlock()
  $modalContactAddBtn = document.createElement("div"), // кнопка для добавления нового селекта+инпута контактов - функция createContactsBlock()
  $modalWrapContacts = document.createElement("div"), // обёртка для блока контактов, в который будем добавлять строки селект+контакт+кнопкаУдалить
  contactsLimit = 10, // предельное количество контактов
  wrapIdCountStart = 0, // начальное значение счётчика id, чтобы не пересекались служебные id и id клиентов, слуюежные id генерируются по убыванию от 0
  inputMask = new Inputmask("+7(999)-999-99-99") // маска на опцию Телефон https://github.com/horprogs/Just-validate

let
  $modalWrapInputContact,
  $modalWrapInputContactAll,
  $modalSelectContact,
  $modalInputContact,
  $modalBtnDeleteContact,
  wrapIdCount = wrapIdCountStart

// МОДАЛКИ - общие элементы
const
// заголовок и форма
  $modalTitle = document.createElement("span"),
  $modalTitleIdClient = document.createElement("span"),
  $modalForm = document.createElement("form"),
  // обёртка для инпутов и плэйсхолдеров
  $modalInputSurnameWrap = document.createElement("div"),
  $modalInputNameWrap = document.createElement("div"),
  $modalInputLastnameWrap = document.createElement("div"),
  // инпуты
  $modalInputSurname = document.createElement("input"),
  $modalInputName = document.createElement("input"),
  $modalInputLastname = document.createElement("input"),
  // плэйсхолдеры
  $modalInputSurnamePlaceholder = document.createElement("span"),
  $modalInputNamePlaceholder = document.createElement("span"),
  $modalInputLastnamePlaceholder = document.createElement("span"),
  // звёздочки на обязательных полях
  $modalInputSurnamePlaceholderReq = document.createElement("span"),
  $modalInputNamePlaceholderReq = document.createElement("span")

// ФУНКЦИЯ создания общей структуры модального окна Добавить / Изменить 
function createModalStructure() {
  // зоголовок
  $modal.append($modalTitle)
  $modalTitle.append($modalTitleIdClient)
    // форма
  $modal.append($modalForm)
    // обёртка для инпутов
  $modalForm.append($modalInputSurnameWrap)
  $modalForm.append($modalInputNameWrap)
  $modalForm.append($modalInputLastnameWrap)
    // инпуты
  $modalInputSurnameWrap.append($modalInputSurname)
  $modalInputNameWrap.append($modalInputName)
  $modalInputLastnameWrap.append($modalInputLastname)
    // плэйсхолдеры
  $modalInputSurnameWrap.append($modalInputSurnamePlaceholder)
  $modalInputNameWrap.append($modalInputNamePlaceholder)
  $modalInputLastnameWrap.append($modalInputLastnamePlaceholder)
    // обёртка для блока контактов
  $modalForm.append($modalBlockContacts)
    // кнопки и обёртки
  $modalForm.append($modalBtnWrap)
  $modalBtnWrap.append($modalAddBtn)
  $modalBtnWrap.append($modalCanselBtnForAdd)
    // стилизация заголовка и формы
    // $modalTitle.textContent = "Новый клиент"
  $modalTitle.classList.add("font-700-18-25", "font-black", "mb-11")
  $modalForm.classList.add("flex-column", "form__frame")
    // стилизация обёрток инпутов
  $modalInputSurnameWrap.classList.add("input-parent")
  $modalInputNameWrap.classList.add("input-parent")
  $modalInputLastnameWrap.classList.add("input-parent", "mb-25")
    // стилизация инпутов
  $modalInputSurname.classList.add("input-fio", "font-400-14-19", "fw-600")
  $modalInputName.classList.add("input-fio", "font-400-14-19", "fw-600")
  $modalInputLastname.classList.add("input-fio", "font-400-14-19", "fw-600", )
    // стилизация плэйсхолдеров
  $modalInputSurnamePlaceholder.textContent = "Фамилия"
  $modalInputNamePlaceholder.textContent = "Имя"
  $modalInputLastnamePlaceholder.textContent = "Отчество"
  $modalInputSurnamePlaceholder.classList.add("font-400-14-19", "font-gray", "placeholder")
  $modalInputNamePlaceholder.classList.add("font-400-14-19", "font-gray", "placeholder")
  $modalInputLastnamePlaceholder.classList.add("font-400-14-19", "font-gray", "placeholder")
    // звёздочки на обязательных полях
  $modalInputSurnamePlaceholder.append($modalInputSurnamePlaceholderReq)
  $modalInputNamePlaceholder.append($modalInputNamePlaceholderReq)
    // звёздочки на обязательных полях
  $modalInputSurnamePlaceholderReq.textContent = "*"
  $modalInputNamePlaceholderReq.textContent = "*"
  $modalInputSurnamePlaceholderReq.classList.add("font-violet")
  $modalInputNamePlaceholderReq.classList.add("font-violet")
    // стилизация кнопки
  $modalBtnWrap.classList.add("flex-center", "columns")
  $modalBtnWrap.prepend($errorWrap)
  $errorWrap.classList.add("flex-center", "columns", "error")
  $errorWrap.innerHTML = ""
  $modalAddBtn.textContent = "Сохранить"
  $modalAddBtn.classList.add("btn-reset", "primary", "mb-5", "p-12-26", "font-400-14-19", "fw-600")

  // слушаем инпуты, чтобы управлять плэйсхолдером
  $modalInputSurname.addEventListener("input", function() {
    if (!$modalInputSurname.value) $modalInputSurnamePlaceholder.classList.remove("input-parent-completed")
    else $modalInputSurnamePlaceholder.classList.add("input-parent-completed")
  })
  $modalInputName.addEventListener("input", function() {
    if (!$modalInputName.value) $modalInputNamePlaceholder.classList.remove("input-parent-completed")
    else $modalInputNamePlaceholder.classList.add("input-parent-completed")
  })
  $modalInputLastname.addEventListener("input", function() {
    if (!$modalInputLastname.value) $modalInputLastnamePlaceholder.classList.remove("input-parent-completed")
    else $modalInputLastnamePlaceholder.classList.add("input-parent-completed")
  })
}

// ФУНКЦИЯ создания блока управления контактами  
// добавить новую строку селект+контакт по клику на кнопку
function createContactsInput() {
  // создаём строку селект+контакт
  $modalWrapInputContact = document.createElement("div") // строка селект+контакт
  $modalWrapInputContactAll = document.getElementsByName("contact") // коллекция созданных в разметке строк селект+контакт для подсчёта количества контактов и блокировка кнопки
  $modalSelectContact = document.createElement("select") // селект контакта
  $modalInputContact = document.createElement("input") // инпут контакта
  $modalBtnDeleteContact = document.createElement("div") // кнопкаУдалить контакт
    // рисуем строку селект+контакт
  $modalWrapContacts.append($modalWrapInputContact)
  $modalWrapInputContact.setAttribute('id', wrapIdCount);
  wrapIdCount -= 1
  $modalWrapInputContact.classList.add("flex-be", "w-390", "mb-15", "input-mt-25")
    // рисуем селект с вариантами выбора
  $modalWrapInputContact.append($modalSelectContact)
  $modalSelectContact.setAttribute('id', wrapIdCount);
  wrapIdCount -= 1
  $modalSelectContact.classList.add("select", "js-contact-choices")
  $modalSelectContact.options[0] = new Option("Телефон", "Телефон");
  $modalSelectContact.options[1] = new Option("Email", "Email");
  $modalSelectContact.options[2] = new Option("Facebook", "Facebook");
  $modalSelectContact.options[3] = new Option("VK", "VK");
  $modalSelectContact.options[4] = new Option("Другое", "Другое");
  // вешаем слушателя на селект для установки типов и классов 
  $modalSelectContact.addEventListener('change', function(event) {
    const id = Number(event.target.id) - 1 // id селекта - 1 = id инпута, соответствующего данному селекту в разметке
    const input = document.getElementById(id)
      // мониторинг изменения опции, установка нового типа инпута, маски или её снятие
    if (event.detail.value == "Телефон") {
      input.setAttribute("name", "tel");
      // проверка на заполненность поля (установить маску можно только на пустое поле, иначе маска удаляет текст)
      if (!input.value) { inputMask.mask(input); } else return
    } else if (event.detail.value == "Email") {
      input.setAttribute("name", "Email");
      Inputmask.remove(input);
    } else if (event.detail.value == "Facebook") {
      input.setAttribute("name", "Facebook");
      Inputmask.remove(input);
    } else if (event.detail.value == "VK") {
      input.setAttribute("name", "VK");
      Inputmask.remove(input);
    } else if (event.detail.value == "Другое") {
      input.setAttribute("name", "common");
      Inputmask.remove(input);
    }
  });
  // рисуем инпут 
  $modalWrapInputContact.append($modalInputContact)
  $modalInputContact.setAttribute('id', wrapIdCount);
  $modalInputContact.setAttribute("name", "tel"); // телефон любезно указан в макете первым, поэтому "name", "tel" присваиваем сразу, вешаем маску
  inputMask.mask($modalInputContact);
  wrapIdCount -= 1
  $modalInputContact.classList.add("gray-2", "contact-input", "font-400-14-19", "fw-600", "font-black")
  $modalInputContact.placeholder = "Введите данные контакта"
  $modalWrapInputContact.append($modalBtnDeleteContact)
  $modalBtnDeleteContact.setAttribute('id', wrapIdCount);
  $modalWrapInputContact.setAttribute('name', "contact");
  wrapIdCount -= 1
  $modalBtnDeleteContact.classList.add("flex-center", "cp", "delete-contact-btn")
    // обработка события кнопки Удалить контакт (строка на 3 больше кнопки)
  $modalBtnDeleteContact.onclick = function(e) {
      btnDeleteContact(e)
      if (!document.getElementById(Number(e.target.id) + 3)) { return } else { btnDeleteContact(e) }
    }
    // функция подсчёта количества контактов, блокировка кнопки добавления контакта и удаления маргина под формой
  function getQuantityContacts() {
    if (!$modalWrapInputContactAll || $modalWrapInputContactAll.length == 0) {
      $modalContactAddBtn.textContent = "Добавить контакт";
      $modalContactAddBtn.classList.add("contact-btn", "circle-plus");
      $modalContactAddBtn.classList.remove("disabled");
      $modalContactAddBtn.classList.remove("mb-25");
    } else if ($modalWrapInputContactAll.length >= contactsLimit) {
      $modalContactAddBtn.textContent = "Нельзя добавить более " + contactsLimit + " контактов";
      $modalContactAddBtn.classList.remove("contact-btn", "circle-plus");
      $modalContactAddBtn.classList.add("disabled");
    } else {
      $modalContactAddBtn.textContent = "Добавить контакт";
      $modalContactAddBtn.classList.add("contact-btn", "circle-plus");
      $modalContactAddBtn.classList.remove("disabled");
    }
  }
  // функция удаления строки селект + контакт (строка на 3 больше кнопки)
  function btnDeleteContact(e) {
    document.getElementById(Number(e.target.id) + 3).remove()
    getQuantityContacts()
  }
  getQuantityContacts()
}
// рисуем обёртку добавления контакта и кнопки
function createContactsBlock(client) {
  // обёртка и кнопка
  $modalBlockContacts.append($modalWrapContacts) // обёртка для блока контактов
  $modalBlockContacts.append($modalWrapContactAddBtn) // обёртка для кнопки добавления строки селект+контакт
  $modalWrapContactAddBtn.append($modalContactAddBtn) // кнопка для добавления нового селекта+инпута контактов
  $modalBlockContacts.classList.add("mb-25", "w-450", "ml--30", "gray-2")
  $modalContactAddBtn.textContent = "Добавить контакт" // кнопка для добавления нового селекта+инпута контактов
  $modalContactAddBtn.classList.add("btn-reset", "contact-btn", "w-100-h-35", "font-400-14-19", "fw-600", "font-black", "circle-plus", "flex-center")
  $modalWrapContactAddBtn.classList.add("flex-center", "columns") // обёртка для кнопки
  $modalWrapContacts.classList.add("flex-center", "columns") // обёртка для всего блока контактов
    // обработка события кнопки создания новой строки селект+инпут ввода контакта
  $modalContactAddBtn.onclick = function() {
      $modalContactAddBtn.classList.add("mb-25")
      if (!$modalWrapInputContactAll) {
        createContactsInput()
          // запускаем кастомный селект
        createCastomeSelect();
      } else if ($modalWrapInputContactAll.length >= contactsLimit) {
        return
      } else {
        createContactsInput()
          // запускаем кастомный селект
        createCastomeSelect();
      }
    }
    // проверяем наличие контактов, при наличии - рисуем
  if (!client || client.id === undefined) { return } else {
    // проходим циклом по массиву контактов
    client.contacts.forEach(contact => {
      // для каждого контакта создаём строку селект+контакт 
      createContactsInput()
        // определяем выбранную опцию согласно типу контакта
      for (let i = 0; i < $modalSelectContact.options.length; i++) {
        if ($modalSelectContact.options[i].value === contact.type) {
          // устанавливаем выбранную опцию
          $modalSelectContact.options[i].selected = true;
          // определяем name для инпута по типу конаткта клиента
          const selectId = Number($modalSelectContact.id)
          const inputId = selectId - 1
          const input = document.getElementById(inputId)
          if (contact.type == "Телефон") {
            input.setAttribute("name", "tel");
            // проверка на заполненность поля (установить маску можно только на пустое поле, иначе маска удаляет текст при том, что юзер может сделать это непреднамеренно)
            if (!input.value) { inputMask.mask(input); } else return
          } else
          if (contact.type == "Email") {
            input.setAttribute("name", "Email");
            Inputmask.remove(input);
          } else
          if (contact.type == "Facebook") {
            input.setAttribute("name", "Facebook");
            Inputmask.remove(input);
          } else
          if (contact.type == "VK") {
            input.setAttribute("name", "VK");
            Inputmask.remove(input);
          } else
          if (contact.type == "Другое") {
            input.setAttribute("name", "common");
            Inputmask.remove(input);
          }
        }
      }
      // заполняем инпут данными контакта
      $modalInputContact.value = contact.value
    });
    if (client.contacts.length > 0) { $modalContactAddBtn.classList.add("mb-25") }
  }
  // запускаем кастомный селект
  createCastomeSelect();
}

// МОДАЛКА СОЗДАНИЯ КЛИЕНТА ************************************************************************************************

// создать модалку добавления нового клиента
function createAddModal() {
  // зачистка содержимого модалки
  cleanModal()
    // вызвать пустую модалку
  new GraphModal().open('first');
  // создать общую структуру модального окна Добавить / изменить
  createModalStructure()

  // СПЕЦИАЛИТЕТ модалки ДОБАВИТЬ
  // заголовок формы
  $modalTitle.textContent = "Новый клиент"
    // блок управления контактами - блоков инпутов нет т.к. нет данных
  createContactsBlock()
    // кнопка Отменить
  $modalCanselBtnForAdd.textContent = "Отмена"
  $modalCanselBtnForAdd.classList.add("contact-btn")
}

// МОДАЛКА ИЗМЕНЕНИЯ ДАННЫХ ***********************************************************************************

// создать модалку изменения данных
function createChangeModal(client) {
  // зачистка содержимого модалки
  cleanModal()
    // вызвать пустую модалку
  new GraphModal().open('first');
  // создать общую структуру модального окна Добавить / изменить
  createModalStructure()

  // СПЕЦИАЛИТЕТ модалки ИЗМЕНИТЬ
  // заголовок формы
  $modalTitle.textContent = "Изменить данные"
    // вывод id существующего клиента
  let clientId; // id существующего клиента
  $modalTitle.append($modalTitleIdClient)
  if (client.id == undefined) { clientId = notFound } else { clientId = client.id }
  $modalTitleIdClient.textContent = "ID: " + clientId
  $modalTitleIdClient.classList.add("pl-9", "font-400-12-16", "font-gray")
  $modalForm.classList.add("flex-column")
    // блок управления контактами - передаём кдиента, чтобы вывести контакты
  createContactsBlock(client)
    // вывести в инпуты содержимое данных клиента
  if (client.surname == undefined) { $modalInputSurname.value = notFound } else { $modalInputSurname.value = client.surname }
  if (client.name == undefined) { $modalInputName.value = notFound } else { $modalInputName.value = client.name }
  if (client.lastName == undefined) { $modalInputLastname.value = notFound } else { $modalInputLastname.value = client.lastName }
  // поставить плэйсхолдеры в нужное положение
  if (client.surname || client.surname == undefined) { $modalInputSurnamePlaceholder.classList.add("input-parent-completed") } else { $modalInputSurnamePlaceholder.classList.remove("input-parent-completed") }
  if (client.name || client.name == undefined) { $modalInputNamePlaceholder.classList.add("input-parent-completed") } else { $modalInputNamePlaceholder.classList.remove("input-parent-completed") }
  if (client.lastName || client.lastName == undefined) { $modalInputLastnamePlaceholder.classList.add("input-parent-completed") } else { $modalInputLastnamePlaceholder.classList.remove("input-parent-completed") }
  // кнопка Отменить
  $modalCanselBtnForAdd.textContent = "Отмена"
  $modalCanselBtnForAdd.classList.add("contact-btn")
    // кнопка Удалить клиента
  $modalBtnWrap.append($modalChangeBtnDelete)
  $modalChangeBtnDelete.classList.add("contact-btn")
  $modalChangeBtnDelete.textContent = "Удалить клиента"
  $modalChangeBtnDelete.classList.add("btn-reset", "cancel-btn", "font-400-12-16")
}

// МОДАЛКА УДАЛЕНИЯ КЛИЕНТА *********************************************************************
function createDeleteModal(client) {
  // зачистка содержимого модалки
  cleanModal()
    // вызвать пустую модалку
  new GraphModal().open('first');
  // заполнить пустую модалку, чтобы "Изменить данные клиента"
  const $modalDeleteWrap = document.createElement("div"),
    $modalDeleteTitle = document.createElement("div"),
    $modalDeleteClient = document.createElement("div")

  $modal.append($modalDeleteWrap)
  $modalDeleteWrap.classList.add("flex-center", "columns")
  $modalDeleteWrap.append($modalDeleteTitle)
  $modalDeleteTitle.textContent = "Удалить клиента"
  $modalDeleteTitle.classList.add("font-700-18-25", "font-black", "mb-11")
  $modalDeleteWrap.append($modalDeleteClient)
  $modalDeleteClient.innerHTML = "<p>Вы действительно хотите удалить клиента:</p><p class='fw-600'>" + client.fio + "?</p>"
  $modalDeleteClient.classList.add("font-400-14-19", "text-center", "mb-25")
  $modalDeleteWrap.append($modalBtnWrap)
  $modalBtnWrap.classList.add("flex-center", "columns")
  $modalBtnWrap.prepend($errorWrap)
  $errorWrap.classList.add("flex-center", "columns", "error")
  $errorWrap.innerHTML = ""
  $errorWrap.classList.add("flex-center", "columns", "error")
  $modalBtnWrap.append($modalDeleteBtn)
  $modalDeleteBtn.textContent = "Удалить"
  $modalDeleteBtn.classList.add("btn-reset", "primary", "mb-5", "p-12-26", "font-400-14-19", "fw-600")
  $modalBtnWrap.append($modalCanselBtnForDelete)
  $modalCanselBtnForDelete.textContent = "Отмена"
  $modalCanselBtnForDelete.classList.add("btn-reset", "cancel-btn", "font-400-12-16")
}

// ****************** ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ********************************************************

// кастомный селект 
const createCastomeSelect = () => {
  const elements = document.querySelectorAll('.js-contact-choices');
  elements.forEach(el => {
    const choices = new Choices(el, {
      shouldSort: false,
      searchEnabled: false,
      itemSelectText: '',
      position: 'bottom',
    });
  });
}

// зачистка модалки
function cleanModal() {
  $modal.innerHTML = ""
  $modalWrapContacts.innerHTML = ""
  if (!$modalInputSurname.value) $modalInputSurnamePlaceholder.classList.remove("input-parent-completed")
  if (!$modalInputName.value) $modalInputNamePlaceholder.classList.remove("input-parent-completed")
  if (!$modalInputLastname.value) $modalInputLastnamePlaceholder.classList.remove("input-parent-completed")
  $modalContactAddBtn.classList.remove("mb-25")
  wrapIdCount = wrapIdCountStart
}

// зачистка обёртки кнопок
function cleanWrapBtn() {
  $modalBtnWrap.remove()
  $modalAddBtn.remove()
  $modalChangeBtn.remove()
  $modalDeleteBtn.remove()
  $modalChangeBtnDelete.remove()
  $modalCanselBtnForDelete.remove()
  $modalCanselBtnForAdd.remove()
  $modalWrapContacts.innerHTML = ""
}

export {
  $modalAddBtn,
  $modalChangeBtn,
  $modalDeleteBtn,
  $errorWrap,
  $modalBtnWrap,
  createAddModal,
  $modalForm,
  createChangeModal,
  $modalInputSurname,
  $modalInputName,
  $modalInputLastname,
  cleanWrapBtn,
  createDeleteModal,
  $modalInputContact,
  $modalWrapContacts,
  $modalChangeBtnDelete,
  $modalCanselBtnForAdd,
  $modalCanselBtnForDelete,
  $modalContactAddBtn
}