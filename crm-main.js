import Client from "./client.js";
import Error from "./error.js";
import {
  $modalAddBtn,
  $modalChangeBtn,
  $modalDeleteBtn,
  createAddModal,
  $modalForm,
  $modalInputSurname,
  $modalInputName,
  $modalInputLastname,
  createChangeModal,
  createDeleteModal,
  cleanWrapBtn,
  $errorWrap,
  $modalInputContact,
  $modalWrapContacts,
  $modalChangeBtnDelete,
  $modalCanselBtnForAdd,
  $modalCanselBtnForDelete,
  $modalContactAddBtn
} from "./modals.js";

(function() {
  // глобальные константы и переменные
  const
    $main = document.getElementById("main"),
    $clientsList = document.getElementById("clients"),
    $clientsListTHAll = document.querySelectorAll(".table th"),
    $errorContent = document.createElement("div"),
    $btnAddClient = document.createElement("button"),
    kod404 = "Ошибка! Клиент не найден. Возможно его уже удалили. Список клиентов перезагружен.",
    kod500 = "Ошибка! Невероятно, но сервер сломался и работать не будет.",
    errorMask = 'Пожалуйста полностью очистите поле "Телефон", выберете любой вариант кроме варианта "Телефон", затем снова выберете вариант "Телефон" и введите номер телефона клиента с использованием маски номера телефона. ',
    errorMail = 'Поле "Email" должно солержать @. ',
    errorFb = 'Поле "Facebook" должно солержать https://facebook.com/. ',
    errorVk = 'Поле "VK" должно содержать https://vk.com/. ',
    errorTel = 'Поле "Телефон" должено содержать 10 цифр после +7. ',
    textLocalError = ' Данные не будут отправлены на сервер при наличии в полях "Фамилия", "Имя", "Отчество"  цифр, букв латинского алфавита, символов (кроме тире). '

  let
    $searchInput = document.getElementById("search-input"),
    clients = [],
    data = [],
    newContacts = [],
    newTypeContacts = [],
    newValueContacts = [],
    typeContact = {},
    valueContact = {},
    actualData,
    columnDirection = true, // направление сортировки
    column,
    clientsCopy,
    searchRequest,
    searchClients,
    request,
    fioNormalised,
    exit,
    responseStatus,
    errors = [],
    errorsValidationFromServer = [],
    kod422, //= "Ошибка! Данные не прошли валидацию. "
    $btnUrl,
    $idTD,
    errorMaskFlag, // флаг для ошибки 422 из-за отсутствия маски на инпуте телефона
    errorMailFlag, // флаг для ошибки 422 для поля мэйл
    errorFbFlag, // флаг для ошибки 422 для поля фэйсбук
    errorVkFlag, // флаг для ошибки 422 для поля ВК
    errorTelFlag, // флаг для ошибка в количестве цифр номера телефона
    errorInputArr = [], // массив для записи id инпутов с ошибкой
    regularFio = /[0-9!@#$%^&*()_+=a-zA-Z,.<>]/, // список запрёщённых символов в инпутах фио
    errorFioFlag


  // ****************** ОБЩИЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ********************************************************

  // ФУНКЦИЯ зачистки строк таблицы и массива с клиентами
  function deleteTRandClients() {
    const $TR = $clientsList.querySelectorAll("tr")
    $TR.forEach($TR => { $TR.remove() })
    clients = []
  }

  // ФУНКЦИЯ создания массива экземпляров класса Ошибка из данных сервера
  function cteateErrorsList(errorsValidationFromServer) {
    errors = []
    errorsValidationFromServer.forEach(error => {
      errors.push(new Error(error.field, error.message))
    });
  }

  // ФУНКЦИЯ обработки текста всех ошибок
  function getErrorsText(errors) {
    kod422 = "Ошибка! Данные не прошли валидацию на сервере. "
    errors.forEach(error => {
      kod422 += error.errorText
    })
    if (errorMaskFlag === true) { kod422 += errorMask }
    if (errorMailFlag === true) { kod422 += errorMail }
    if (errorFbFlag === true) { kod422 += errorFb }
    if (errorVkFlag === true) { kod422 += errorVk }
    if (errorTelFlag === true) { kod422 += errorTel }
  }
  // ФУНКЦИЯ обработки массива ошибок инпутов контакта
  function addErrorClassForContactInput(errorInputArr) {
    // зачистка
    document.querySelectorAll("input").forEach(el => { el.classList.remove("contact-input__error") })
      // рендер актуальных ошибок
    errorInputArr.forEach(el => { document.getElementById(el).classList.add("contact-input__error") })
  }

  // ФУНКЦИЯ обработки статусов ответа сервера
  function showErrorServer(responseStatus) {
    // проверка статуса ответа при получении актуальных данных с сервера
    $errorContent.innerHTML = ""
    exit = 0
    $errorWrap.prepend($errorContent)
    if (responseStatus === 200 || responseStatus === 201) {
      return
    } else if (responseStatus === 404) {
      reseived404(kod404)
      deleteTRandClients()
      getClients().then(() => {
        hendlerRenderClients()
      })
    } else if (responseStatus === 422) {
      // создать массив экземпляров класса Ошибка из данных сервера
      cteateErrorsList(errorsValidationFromServer);
      // обработать тексты всех ошибок
      getErrorsText(errors)
        // обработать массив ошибок инпутов контакта
      addErrorClassForContactInput(errorInputArr)
      $errorContent.textContent = kod422
      exit += 1
    } else if (responseStatus >= 500) {
      reseived404(kod500)
    }
  }

  // ФУНКЦИЯ визулизации локальных ошибок
  function showErrorLocal() {
    $errorContent.innerHTML = ""
    $errorWrap.prepend($errorContent)
    if (errorFioFlag === false) { return } else { $errorContent.textContent = textLocalError }
  }

  // ФУНКЦИЯ локальной валидации инпутов фио 
  function inputLocalValidation(input) {
    let timeout;
    if (timeout) { clearTimeout(timeout); }
    timeout = setTimeout(() => {}, 300);
    if (regularFio.test(input.value) === true) {
      input.classList.add("input-fio__error");
    } else {
      input.classList.remove("input-fio__error");
    }
  }

  // ФУНКЦИЯ локальной валидации фио - проверка на инпутах классов ошибок и блокирование отправки на сервер
  function localValidation() {
    const inputs = document.querySelectorAll("input")
    errorFioFlag = false
    document.querySelectorAll("input").forEach(input => { if (input.classList.contains('input-fio__error')) errorFioFlag = true })
  }

  // ФУНКЦИЯ установки слушателей на инпуты фио для локальной валидации
  function setListenerLocalValidation() {
    $modalInputSurname.addEventListener("input", function() {
      inputLocalValidation($modalInputSurname);
    })
    $modalInputName.addEventListener("input", function() {
      inputLocalValidation($modalInputName);
    })
    $modalInputLastname.addEventListener("input", function() {
      inputLocalValidation($modalInputLastname);
    })
  }

  // ФУНКЦИЯ зачистка классов валидации
  function removeErrorClass() {
    $modalInputSurname.classList.remove("input-fio__error");
    $modalInputName.classList.remove("input-fio__error");
    $modalInputLastname.classList.remove("input-fio__error");
  }

  // ФУНКЦИЯ зачистки дива с ошибкой
  function showErrorClean() {
    $errorContent.remove();
  }

  // ФУНКЦИЯ нормализации ФИО: первая буква ЗАГЛАВНАЯ, все остальные - строчные при любом вводе 
  function getNameNormolised(text) {
    if (!text) return text;
    let textTrim
    textTrim = text.trim()
    fioNormalised = textTrim[0].toUpperCase() + (textTrim.toLowerCase()).slice(1);
    return fioNormalised;
  };

  // ФУНКЦИЯ создания массива контактов из значений селект+инпут
  function createNewContactsArr() {
    // обнуляем флаги кастомных ошибок и масив ошибок
    errorMaskFlag = false
    errorMailFlag = false
    errorFbFlag = false
    errorVkFlag = false
    errorTelFlag = false
    errorInputArr = []
      // объявляем классы для объектов массивов
    if (!$modalInputContact) { return } else {
      // объект для значений селекта
      class TypeContact {
        constructor(type) {
          this.type = type
        }
      }
      // объект для значений инпута
      class ValueContact {
        constructor(value) {
          this.value = value
        }
      }
      // сбор значений селекта и инпута в массивы
      newTypeContacts = Array.from($modalWrapContacts.querySelectorAll('select')).map(select => {
        typeContact = new TypeContact(select.value)
        return typeContact
      })
      newValueContacts = Array.from($modalWrapContacts.querySelectorAll('input')).map(input => {
          // валидация контактов перед отправкой на сервер (функционирует совместно с валидацией сервера)
          // контроль поля Телефон, если опция телефон, то следим за установкой маски
          if (input.name == "tel" && !input.inputmask) {
            errorMaskFlag = true;
            errorInputArr.push(input.id);
            return
          } else if (input.name == "tel" && input.inputmask) {
            if (input.inputmask.unmaskedvalue().length < 10) {
              errorTelFlag = true;
              errorInputArr.push(input.id);
              return
            }
          } else if (input.name == "tel") { if (input.inputmask.unmaskedvalue().length !== 10) { return } }
          // контроль поля Email
          if (input.name == "Email" && !input.value.includes("@")) {
            errorMailFlag = true;
            errorInputArr.push(input.id);
            return
          }
          // контроль поля Facebook
          if (input.name == "Facebook" && !input.value.includes("https://facebook.com")) {
            errorFbFlag = true;
            errorInputArr.push(input.id);
            return
          }
          // контроль поля VK
          if (input.name == "VK" && !input.value.includes("https://vk.com/")) {
            errorVkFlag = true;
            errorInputArr.push(input.id);
            return
          }
          valueContact = new ValueContact(input.value)
          return valueContact
        })
        // слияние объектов селект и инпут в один объект одного массива
      newContacts = newValueContacts.map((item, index) => ({...item, ...newTypeContacts[index] }));
    }
  }

  // ФУНКЦИЯ зачистки инпутов модалки добавления клиента при её закрытии
  function cleanInputs() {
    $modalInputSurname.value = ""
    $modalInputName.value = ""
    $modalInputLastname.value = ""
  }

  // ФУНКЦИЯ закрытия модалки на кнопке Отмена 
  $modalCanselBtnForAdd.onclick = function(event) {
      if (event.target === $modalCanselBtnForAdd)
        document.getElementById("graph-modal__close").click()
      cleanInputs()
    }
    // кнопка Отмена для модалки Удалить
  $modalCanselBtnForDelete.onclick = function(event) {
      if (event.target === $modalCanselBtnForDelete)
        document.getElementById("graph-modal__close").click()
    }
    // ФУНКЦИЯ визуализация добавления / изменения строки с клиентом
  function trAddCucces(client) {
    document.getElementById(client.id).classList.add("success-tr")
    setTimeout(function() {
      document.getElementById(client.id).classList.remove("success-tr")
    }, 1000);
  }

  // ФУНКЦИЯ обработки ответов сервера 500 и 404
  function reseived404(kod) {
    deleteTRandClients()
    $errorContent.textContent = kod
    $modalAddBtn.remove()
    $modalDeleteBtn.remove()
    $modalChangeBtn.remove()
    $modalContactAddBtn.remove()
    $modalChangeBtnDelete.remove()
    $modalCanselBtnForDelete.remove()
    $modalCanselBtnForAdd.remove()
    exit += 1
  }

  // *************** МЕТОДЫ ОБЩЕНИЯ С СЕРВЕРОМ ***************************************** 

  // МЕТОД 1: получить список клиентов
  // запросить у сервера список клиентов для первичной загрузки проги
  async function getClients() {
    let response = [];
    response = await fetch(`http://localhost:3000/api/clients`);
    data = await response.json();
    if (response.status >= 500) {
      // сообщение об ошибке на главный экран
      document.getElementById("error").textContent = kod500
      document.getElementById("error").classList.add("font-error")
    }
  }
  // создать массив экземпляров класса из данных сервера
  function cteateClientsList(data) {
    data.forEach(client => {
      clients.push(new Client(Number(client.id), client.name, client.surname, client.lastName, client.createdAt, client.updatedAt, client.contacts))
    });
  }

  // МЕТОД 2: создать нового клиента 
  // отправить запрос на добавление нового клиента, получить его обработанные данные с сервера, нарисовать новую строку с клиентом
  const handlerAddClient = async function(e) {
      e.preventDefault();
      // создать массив экземпляров класса Контакт из значений инпута 
      createNewContactsArr()
        //   локальная валидация фио - проверка ошибок на инпутах
      localValidation()
        // визулизация локальных ошибок
      showErrorLocal()
      if (errorFioFlag === true) return // прерываем отправку на сервер при наоичии локальных ошибок

      // запрос на сервер
      const response = await fetch('http://localhost:3000/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          surname: getNameNormolised($modalInputSurname.value.trim()),
          name: getNameNormolised($modalInputName.value.trim()),
          lastName: getNameNormolised($modalInputLastname.value.trim()),
          contacts: newContacts
        })
      });

      // создать новый экземпляр класса Клиент
      const data = await response.json()

      // записать ошибки 422, полученные с сервера в переменную
      errorsValidationFromServer = data.errors
        // зачистить и показать ошибки сервера
      showErrorClean()
      showErrorServer(response.status)
      if (exit > 0) return;
      let client = new Client(Number(data.id), data.name, data.surname, data.lastName, data.createdAt, data.updatedAt, data.contacts)

      // добавить нового клиента в массив браузера для рендера
      clients.push(client)
      $clientsList.prepend(newClientTR(client))
        // инизализация typpi
      tippy('[data-tippy-content]')
        // проверка статуса ответа
      showErrorServer(response.status)
      if (exit > 0) return;
      // закрытие модалки
      document.getElementById("graph-modal__close").click()
        // визуализация результата создания строки клиента для юзера
      trAddCucces(client)
    }
    // добавить нового клиента в список и ренедерить - import createAddModal from "./modals.js";
  function addClient() {
    // зачистка формы
    cleanWrapBtn()
      // зачистка инпутов
    cleanInputs()
      // зачистка классов валидации
    removeErrorClass()
      // создать модалку "Добавить нового клиента" 
    createAddModal()
      // локальная валидация фио - слушатели на инпуты фио
    setListenerLocalValidation()
      // удалить обработчик события изменений
    $modalForm.removeEventListener("submit", handlerChangeClient)
      // повесить обработчик события и функцию изенения данных
    $modalForm.addEventListener("submit", handlerAddClient)

  }

  // МЕТОД 3: перезаписать данные о клиенте с переданным ID
  // 3.1. получить данные клиента по его ID
  async function getClientById(idClient) {
    const response = await fetch(`http://localhost:3000/api/clients/${idClient}`, {
      method: 'GET',
    });
    // сохранение ответа сервера в переменную
    actualData = await response.json();
    // проверка статуса ответа при получении актуальных данных с сервера
    responseStatus = response.status

    return responseStatus
  }

  // 3.2. перезаписать данные о клиенте с переданным ID
  const handlerChangeClient = async function(e) {
    e.preventDefault();
    // создать массив экземпляров класса Контакт из значений инпута 
    createNewContactsArr()
      //   локальная валидация фио - проверка ошибок на инпутах
    localValidation()
      //визулизация локальных ошибок
    showErrorLocal()
    if (errorFioFlag === true) return // прерываем отправку на сервер при наоичии локальных ошибок

    // запрос на сервер
    const response = await fetch(`http://localhost:3000/api/clients/${actualData.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        surname: getNameNormolised($modalInputSurname.value.trim()),
        name: getNameNormolised($modalInputName.value.trim()),
        lastName: getNameNormolised($modalInputLastname.value.trim()),
        contacts: newContacts
      })
    });

    // проверка статуса ответа при возврате изменённых данных на сервер
    const data = await response.json()
      // записать ошибки 422, полученные с сервера в переменную
    errorsValidationFromServer = data.errors
    showErrorServer(response.status)
    if (exit > 0) return;

    // создать новый экземпляр класса Клиент для рендера 
    let changedClient = new Client(Number(data.id), data.name, data.surname, data.lastName, data.createdAt, data.updatedAt, data.contacts)

    // замена данных клиента в массиве браузера
    let client = clients.find(item => item.id == data.id);
    let clientIndex = clients.indexOf(client)
    clients.splice(clientIndex, 1, changedClient);
    let $changedClientTR = newClientTR(changedClient)
      // замена старых данных новыми из разметки
    const elementReplace = document.getElementById(changedClient.id)
    elementReplace.replaceWith($changedClientTR)
      // инизализация typpi
    tippy('[data-tippy-content]')
      // закрытие модалки
    document.getElementById("graph-modal__close").click()
      // зачистка формы
    cleanInputs()
      // визуализация результата создания строки клиента для юзера
    trAddCucces(client)
  }

  // изменить данные клиента и нарисовать строку с новыми данными
  function onChange(client) {
    // зачистка формы
    cleanWrapBtn()
      // получить id клиента из объекта и передать в  getClientById (чтобы повторно использовать эту функцию для открытия карточки клиента)
    let idClient = client.id
      // запросить актуальные данные у сервера
    getClientById(idClient).then(() => {
        // зачистка классов валидации
        removeErrorClass()
          // создать модалку "Изменить данные клиента" и заполнить данными с сервера
        createChangeModal(actualData)
          // обработать ошибки 
        showErrorServer(responseStatus)
          // локальная валидация фио - слушатели на инпуты фио
        setListenerLocalValidation()
          // удалить обработчик события добавления
        $modalForm.removeEventListener("submit", handlerAddClient)
          // повесить обработчик события
        $modalForm.addEventListener("submit", handlerChangeClient)

      })
      // 3.3. удалить этого клиента
    $modalChangeBtnDelete.addEventListener("click", function(event) {
      onDelete(client);
      event.stopPropagation();
    });
  }

  // МЕТОД 4: удалить клиента по ID
  // метод удаления данные клиента с сервера, обработать ответ
  async function deleteClientOnServer(client) {
    const response = await fetch(`http://localhost:3000/api/clients/${client.id}`, {
      method: 'DELETE',
    });
    // проверка статуса ответа
    showErrorServer(response.status)
    if (exit > 0) return;
  }
  // удаление строки с клиентом в разметке
  // если в аргумент передать 1, то строку не удалять, а покрасить красным + написать вместо id 'Клиент удалён'
  function handlerDeleteClient(client, color) {
    deleteClientOnServer(client).then(() => {
      // удаление данных клиента в разметке
      const $elementDelete = document.getElementById(client.id)
      const $clientDeleted = document.getElementById("td-" + client.id)

      if (!$elementDelete) { return }
      if (color === 1) {
        $clientDeleted.textContent = 'Клиент удалён';
        $clientDeleted.style.color = 'red';
        $clientDeleted.style.fontWeight = '700';
        $elementDelete.classList.add("deleted-tr");
      } else $elementDelete.remove()


      // удаление данных клиента в массиве браузера
      let clientDelete = clients.find(item => item.id == client.id);
      let clientIndex = clients.indexOf(clientDelete)
      clients.splice(clientIndex, 1);
      // закрытие модалки
      document.getElementById("graph-modal__close").click()
    })
  }

  function onDelete(client) {
    // зачистка формы
    cleanWrapBtn()
      // создать модалку "Удалить клиента" 
    createDeleteModal(client)
      // повесить обработчик события
    $modalDeleteBtn.onclick = function(event) {
      if (event.target === $modalDeleteBtn)
      // если в аргумент передать 1, то строку не удалять, а покрасить красным + написать вместо id 'Клиент удалён'
        handlerDeleteClient(client, 1)
    }
  }

  // МЕТОД 5: поиск
  // запросить у сервера данные по поисковой строке
  async function getSearch(request) {
    let response = [];
    response = await fetch(`http://localhost:3000/api/clients?search=${request}`);
    searchRequest = await response.json();
  }
  // создать массив экземпляров класса из данных сервера
  function cteateSearchList(searchRequest) {
    searchClients = []
    searchRequest.forEach(client => {
      searchClients.push(new Client(Number(client.id), client.name, client.surname, client.lastName, client.createdAt, client.updatedAt, client.contacts))
    });
    return searchClients
  }
  // чтение на инпуте поиска
  function inputText() {
    let timeout;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      request = $searchInput.value
    }, 300);
    // извлечь данные из поискового промиса , создать массив экземпляров класса, рендерить таблицу
    getSearch(request).then(() => {
      cteateSearchList(searchRequest)
      render(searchClients)
    })
  }
  $searchInput.addEventListener("input", inputText);

  // обработчик события на форму поиска
  document.getElementById("search-form").addEventListener("submit", function(e) {
    e.preventDefault()
    request = $searchInput.value
      // извлечь данные из поискового промиса , создать массив экземпляров класса, рендерить таблицу
    getSearch(request).then(() => {
      cteateSearchList(searchRequest)
      render(searchClients)
    })
  })

  // ****************** РАБОТА С КАРТОЧКОЙ КЛИЕНТА ***************************

  // функция создания ссылки на карточку клиента и копирование в буфер обмена
  function onCopyUrl(client) {
    // генерация url карточки клиента 
    const
      url = new URL(window.location.href),
      urlClient = url.origin + url.pathname + "#" + client.id,
      $successBtn = document.getElementById("url-" + client.id)

    // запись url запись в буфер обмена адреса
    navigator.clipboard.writeText(urlClient)
      // визуализация процесса копирования для юзера
    $successBtn.classList.add("btn-status", "success")
    $successBtn.textContent = "URL скопирован"
    setTimeout(function() {
      $successBtn.classList.remove("success");
    }, 800);
    setTimeout(function() {
      $successBtn.classList.remove("btn-status");
      $successBtn.textContent = "Копировать URL"
    }, 1000);
  }

  // контроль хэша и открытие ссылки на карточку клиента
  function hashchListener() {
    const
      url = new URL(window.location.href),
      hash = url.hash,
      idClientFromHash = hash.slice(1);
    // запросить актуальные данные у сервера
    getClientById(idClientFromHash).then(() => {
      // зачистка классов валидации
      removeErrorClass()
        // создать модалку "Изменить данные клиента" и заполнить данными с сервера
      createChangeModal(actualData)
        // локальная валидация фио - слушатели на инпуты фио
      setListenerLocalValidation()
        // обработать ошибки 
      showErrorServer(responseStatus)
        // удалить обработчик события добавления
      $modalForm.removeEventListener("submit", handlerAddClient)
        // повесить обработчик события
      $modalForm.addEventListener("submit", handlerChangeClient)
    })
  }
  // вешаем слушателя
  window.addEventListener("hashchange", hashchListener)

  // *************** СОЗДАНИЕ ЭЛЕМЕНТОВ РАЗМЕТКИ *********************************** 

  // создать строку с клиентом
  function newClientTR(client) {
    const $clientTR = document.createElement("tr"),
      $fioTD = document.createElement("td"),
      $createdTD = document.createElement("td"),
      $createdSpanDateTD = document.createElement("span"),
      $createdSpanTimeTD = document.createElement("span"),
      $updatedTD = document.createElement("td"),
      $updatedSpanDateTD = document.createElement("span"),
      $updatedSpanTimeTD = document.createElement("span"),
      $contactsTD = document.createElement("td"),
      $actionsTD = document.createElement("td"),
      $btnChange = document.createElement("button"),
      $btnChangeSVG = document.createElement("span"),
      $btnDelete = document.createElement("button"),
      $btnDeleteSVG = document.createElement("span")

    $idTD = document.createElement("td")
    $btnUrl = document.createElement("button")
    $btnUrl.setAttribute("id", "url-" + client.id)

    $clientTR.classList.add("tr-hover")
    $clientTR.setAttribute("id", client.id)
    $idTD.classList.add("id", "left", "pl-20", "font-400-12-16", "font-gray")
    $fioTD.classList.add("left", "fio", "font-400-14-19", "font-black")
    $createdTD.classList.add("left", "create-date")
    $createdSpanDateTD.classList.add("left", "font-400-14-19", "font-black", "mr-7")
    $createdSpanTimeTD.classList.add("left", "font-400-14-19", "font-gray")
    $updatedTD.classList.add("left", "last-changes")
    $updatedSpanDateTD.classList.add("left", "font-400-14-19", "font-black", "mr-7")
    $updatedSpanTimeTD.classList.add("left", "font-400-14-19", "font-gray")
    $contactsTD.classList.add("left", "contacts-th")
    $actionsTD.classList.add("left", "actions")
    $btnChangeSVG.classList.add("mr-3")
    $btnChange.classList.add("btn-reset", "font-400-12-16", "change-btn-row", "mr-30", "h-100")
    $btnUrl.classList.add("btn-reset", "font-400-12-16", "change-btn-row", "mr-30", "h-100")
    $btnDeleteSVG.classList.add("mr-3")
    $btnDelete.classList.add("btn-reset", "font-400-12-16", "delete-btn-row", "h-100")

    $idTD.textContent = client.id
    $idTD.setAttribute("id", "td-" + client.id)
    $fioTD.textContent = client.fio
    $createdSpanDateTD.textContent = client.createDate
    $createdSpanTimeTD.textContent = client.createTime
    $updatedSpanDateTD.textContent = client.updateDate
    $updatedSpanTimeTD.textContent = client.updateTime
    $btnChange.textContent = "Изменить"
    $btnUrl.textContent = "Копировать URL"
    $btnDelete.textContent = "Удалить"

    $btnChangeSVG.innerHTML = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 10.5002V13.0002H2.5L9.87333 5.62687L7.37333 3.12687L0 10.5002ZM11.8067 3.69354C12.0667 3.43354 12.0667 3.01354 11.8067 2.75354L10.2467 1.19354C9.98667 0.933535 9.56667 0.933535 9.30667 1.19354L8.08667 2.41354L10.5867 4.91354L11.8067 3.69354Z" fill="#9873FF"/></svg>'
    $btnDeleteSVG.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0C2.682 0 0 2.682 0 6C0 9.318 2.682 12 6 12C9.318 12 12 9.318 12 6C12 2.682 9.318 0 6 0ZM6 10.8C3.354 10.8 1.2 8.646 1.2 6C1.2 3.354 3.354 1.2 6 1.2C8.646 1.2 10.8 3.354 10.8 6C10.8 8.646 8.646 10.8 6 10.8ZM8.154 3L6 5.154L3.846 3L3 3.846L5.154 6L3 8.154L3.846 9L6 6.846L8.154 9L9 8.154L6.846 6L9 3.846L8.154 3Z" fill="#F06A4D"/></svg>'

    // создать спаны для каждого типа контакта из массива контактов
    function createContactTypeSpanTD(client) {
      // вставка svg в разметку
      if (!client.contacts) { return } else {
        client.contacts.forEach(contact => {
          const $contactTypeSpanTD = document.createElement("span");
          const $phone = `<button class="btn-reset typpi-btn" data-tippy-content="${contact.value}"><svg width="16" height="16" viewbox="0 0 16 16"><g opacity="0.7"><circle cx="8" cy="8" r="8" fill="#9873FF"/><path d="M11.56 9.50222C11.0133 9.50222 10.4844 9.41333 9.99111 9.25333C9.83556 9.2 9.66222 9.24 9.54222 9.36L8.84444 10.2356C7.58667 9.63556 6.40889 8.50222 5.78222 7.2L6.64889 6.46222C6.76889 6.33778 6.80444 6.16444 6.75556 6.00889C6.59111 5.51556 6.50667 4.98667 6.50667 4.44C6.50667 4.2 6.30667 4 6.06667 4H4.52889C4.28889 4 4 4.10667 4 4.44C4 8.56889 7.43556 12 11.56 12C11.8756 12 12 11.72 12 11.4756V9.94222C12 9.70222 11.8 9.50222 11.56 9.50222Z" fill="white"/></g></svg></button>`
          const $vk = `<button class="btn-reset typpi-btn" data-tippy-content="${contact.value}"><svg h="16" height="16" viewbox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g opacity="0.7"><path opacity="0.7" d="M8 0C3.58187 0 0 3.58171 0 8C0 12.4183 3.58187 16 8 16C12.4181 16 16 12.4183 16 8C16 3.58171 12.4181 0 8 0ZM12.058 8.86523C12.4309 9.22942 12.8254 9.57217 13.1601 9.97402C13.3084 10.1518 13.4482 10.3356 13.5546 10.5423C13.7065 10.8371 13.5693 11.1604 13.3055 11.1779L11.6665 11.1776C11.2432 11.2126 10.9064 11.0419 10.6224 10.7525C10.3957 10.5219 10.1853 10.2755 9.96698 10.037C9.87777 9.93915 9.78382 9.847 9.67186 9.77449C9.44843 9.62914 9.2543 9.67366 9.1263 9.90707C8.99585 10.1446 8.96606 10.4078 8.95362 10.6721C8.93577 11.0586 8.81923 11.1596 8.43147 11.1777C7.60291 11.2165 6.81674 11.0908 6.08606 10.6731C5.44147 10.3047 4.94257 9.78463 4.50783 9.19587C3.66126 8.04812 3.01291 6.78842 2.43036 5.49254C2.29925 5.2007 2.39517 5.04454 2.71714 5.03849C3.25205 5.02817 3.78697 5.02948 4.32188 5.03799C4.53958 5.04143 4.68362 5.166 4.76726 5.37142C5.05633 6.08262 5.4107 6.75928 5.85477 7.38684C5.97311 7.55396 6.09391 7.72059 6.26594 7.83861C6.45582 7.9689 6.60051 7.92585 6.69005 7.71388C6.74734 7.57917 6.77205 7.43513 6.78449 7.29076C6.82705 6.79628 6.83212 6.30195 6.75847 5.80943C6.71263 5.50122 6.53929 5.30218 6.23206 5.24391C6.07558 5.21428 6.0985 5.15634 6.17461 5.06697C6.3067 4.91245 6.43045 4.81686 6.67777 4.81686L8.52951 4.81653C8.82136 4.87382 8.88683 5.00477 8.92645 5.29874L8.92808 7.35656C8.92464 7.47032 8.98521 7.80751 9.18948 7.88198C9.35317 7.936 9.4612 7.80473 9.55908 7.70112C10.0032 7.22987 10.3195 6.67368 10.6029 6.09801C10.7279 5.84413 10.8358 5.58142 10.9406 5.31822C11.0185 5.1236 11.1396 5.02785 11.3593 5.03112L13.1424 5.03325C13.195 5.03325 13.2483 5.03374 13.3004 5.04274C13.6009 5.09414 13.6832 5.22345 13.5903 5.5166C13.4439 5.97721 13.1596 6.36088 12.8817 6.74553C12.5838 7.15736 12.2661 7.55478 11.9711 7.96841C11.7001 8.34652 11.7215 8.53688 12.058 8.86523Z" fill="#9873FF"/></g></svg></button>`
          const $fb = `<button class="btn-reset typpi-btn" data-tippy-content="${contact.value}"><svg width="16" height="16" viewbox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g opacity="0.7"><path d="M7.99999 0C3.6 0 0 3.60643 0 8.04819C0 12.0643 2.928 15.3976 6.75199 16V10.3775H4.71999V8.04819H6.75199V6.27309C6.75199 4.25703 7.94399 3.14859 9.77599 3.14859C10.648 3.14859 11.56 3.30121 11.56 3.30121V5.28514H10.552C9.55999 5.28514 9.24799 5.90362 9.24799 6.53815V8.04819H11.472L11.112 10.3775H9.24799V16C11.1331 15.7011 12.8497 14.7354 14.0879 13.2772C15.3261 11.819 16.0043 9.96437 16 8.04819C16 3.60643 12.4 0 7.99999 0Z" fill="#9873FF"/></g></svg></button>`
          const $mail = `<button class="btn-reset typpi-btn" data-tippy-content="${contact.value}"><svg width="16" height="16" viewbox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g opacity="0.7"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM4 5.75C4 5.3375 4.36 5 4.8 5H11.2C11.64 5 12 5.3375 12 5.75V10.25C12 10.6625 11.64 11 11.2 11H4.8C4.36 11 4 10.6625 4 10.25V5.75ZM8.424 8.1275L11.04 6.59375C11.14 6.53375 11.2 6.4325 11.2 6.32375C11.2 6.0725 10.908 5.9225 10.68 6.05375L8 7.625L5.32 6.05375C5.092 5.9225 4.8 6.0725 4.8 6.32375C4.8 6.4325 4.86 6.53375 4.96 6.59375L7.576 8.1275C7.836 8.28125 8.164 8.28125 8.424 8.1275Z" fill="#9873FF"/></g></svg></button>`
          const $common = `<button class="btn-reset typpi-btn" data-tippy-content="${contact.value}"><svg width="16" height="16" viewbox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g opacity="0.7"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM3 8C3 5.24 5.24 3 8 3C10.76 3 13 5.24 13 8C13 10.76 10.76 13 8 13C5.24 13 3 10.76 3 8ZM9.5 6C9.5 5.17 8.83 4.5 8 4.5C7.17 4.5 6.5 5.17 6.5 6C6.5 6.83 7.17 7.5 8 7.5C8.83 7.5 9.5 6.83 9.5 6ZM5 9.99C5.645 10.96 6.75 11.6 8 11.6C9.25 11.6 10.355 10.96 11 9.99C10.985 8.995 8.995 8.45 8 8.45C7 8.45 5.015 8.995 5 9.99Z" fill="#9873FF"/></g></svg></button>`

          $contactTypeSpanTD.classList.add("left", "mr-7", "mb-7")
            // определение типа svg для контакта
          if (contact.type === "Телефон") {
            $contactTypeSpanTD.innerHTML = $phone
          } else if (contact.type === "Vk") {
            $contactTypeSpanTD.innerHTML = $vk
          } else if (contact.type === "Facebook") {
            $contactTypeSpanTD.innerHTML = $fb
          } else if (contact.type === "Email") {
            $contactTypeSpanTD.innerHTML = $mail
          } else { $contactTypeSpanTD.innerHTML = $common }
          $contactsTD.append($contactTypeSpanTD)
        })
      }
    }

    $clientTR.classList.add("table__tr-client")
    $clientTR.append($idTD)
    $clientTR.append($fioTD)
    $clientTR.append($createdTD)
    $createdTD.append($createdSpanDateTD)
    $createdTD.append($createdSpanTimeTD)
    $clientTR.append($updatedTD)
    $updatedTD.append($updatedSpanDateTD)
    $updatedTD.append($updatedSpanTimeTD)
    $clientTR.append($contactsTD)
    createContactTypeSpanTD(client)
    $clientTR.append($actionsTD)
      // добавляем обработчики на кнопки
    $btnChange.addEventListener("click", function(event) {
      showErrorClean();
      onChange(client);
      event.stopPropagation();
    });
    $btnUrl.addEventListener("click", function(event) {
      onCopyUrl(client);
      event.stopPropagation();
    });
    $btnDelete.addEventListener("click", function(event) {
      onDelete(client);
      event.stopPropagation();
    });
    $actionsTD.append($btnChange)
    $btnChange.prepend($btnChangeSVG)
    $actionsTD.append($btnUrl)
    $actionsTD.append($btnDelete)
    $btnDelete.prepend($btnDeleteSVG)

    return $clientTR;
  }
  // создать кнопку добавления клиента
  function createBtnAddClient() {
    const $btnAddClientWrap = document.createElement("div"),
      $btnAddClientSVG = document.createElement("span")

    $btnAddClientSVG.innerHTML = '<svg width="23" height="16" viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 8C16.71 8 18.5 6.21 18.5 4C18.5 1.79 16.71 0 14.5 0C12.29 0 10.5 1.79 10.5 4C10.5 6.21 12.29 8 14.5 8ZM5.5 6V3H3.5V6H0.5V8H3.5V11H5.5V8H8.5V6H5.5ZM14.5 10C11.83 10 6.5 11.34 6.5 14V16H22.5V14C22.5 11.34 17.17 10 14.5 10Z" fill="#9873FF"/></svg>'
    $btnAddClient.textContent = "Добавить клиента"
    $main.append($btnAddClientWrap)
    $btnAddClientWrap.classList.add("flex-center")
    $btnAddClientSVG.classList.add("mr-10")
    $btnAddClient.classList.add("btn-reset", "font-400-14-19", "fw-600", "p-12-26", "secondary")

    // повесить обработчик события на кнопку - добавить нового клиента с запросом на сервер и отрисовкой
    $btnAddClient.addEventListener("click", function() {
      showErrorClean();
      addClient();
    });
    $btnAddClient.prepend($btnAddClientSVG)
    $btnAddClientWrap.append($btnAddClient)
    return $btnAddClient
  }

  // ********************************** СОРТИРОВКА ******************************

  // ФУНКЦИЯ сортировки списка
  function getSortClients(arrSort, prop, dir) {
    const clientsCopy = [...arrSort]
    return clientsCopy.sort(function(clientA, clientB) {
      if ((!dir == false ? clientA[prop] < clientB[prop] : clientA[prop] > clientB[prop]))
        return -1;
    })
  }
  // ФУНКЦИЯ создания таблицы из строк с клиентами и кнопкой "добавить клиента"
  function render(arrRender) {
    clientsCopy = getSortClients(arrRender, column, columnDirection)
    $clientsList.innerHTML = ""
    for (const client of clientsCopy) {
      $clientsList.append(newClientTR(client))
        // при сортировке по ID выделить первого чёрным цветом шрифта
      const $idTDAll = document.getElementsByClassName("id")
      if (column == "id") {
        $idTDAll[1].classList.add("font-black")
      }
    }
    // инизализация typpi
    tippy('[data-tippy-content]')
  }

  // сортировка текущего массива (дефолтного или отфильтрованного)
  $clientsListTHAll.forEach(element => {
    element.addEventListener("click", function() {
      // удаляем класс, если он был добавлен предыдущей сортировкой и добавляем элементу, который сортируют
      $clientsListTHAll.forEach(element => {
        element.classList.remove("th-sort")
      })
      element.classList.add("th-sort")

      column = this.dataset.column;
      columnDirection = !columnDirection;
      // визуализация напрвления сортировки
      const $svgDir = document.getElementById(column)
      const $letterA = document.getElementById("A")
      const $letterZ = document.getElementById("Z")
      if (columnDirection == false) {
        $svgDir.classList.add("arrow-up");
        $svgDir.classList.remove("arrow-down")
      }
      if (columnDirection == true) {
        $svgDir.classList.remove("arrow-up");
        $svgDir.classList.add("arrow-down");
      }
      if (columnDirection == false && column == "fio") {
        $letterA.classList.add("to-right");
        $letterZ.classList.add("to-left")
      }
      if (columnDirection == true && column == "fio") {
        $letterA.classList.remove("to-right");
        $letterZ.classList.remove("to-left");
      }
      render(clients)
    })
  })

  // ********************************** РЕНДЕР **************************************************** 
  function hendlerRenderClients() {
    document.getElementById("preloader").classList.remove('preloader-on')
    document.getElementById("preloader").classList.add('preloader-off')
    document.getElementById("circle").classList.remove('move')
    cteateClientsList(data)
    render(clients)
  }

  // извлечь данные из промиса, создать массив экземпляров класса, рендерить таблицу
  getClients().then(() => {
    hendlerRenderClients()
    createBtnAddClient()
  })

})();