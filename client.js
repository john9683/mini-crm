export default class Client {
    constructor(id, name, surname, lastName, createdAt, updatedAt, contacts) {
        this.id = id
        this.name = name
        this.surname = surname
        this.lastName = lastName
        this.createdAt = createdAt
        this.updatedAt = updatedAt;
        this.contacts = contacts
    }

    get fio() {
        return this.surname + " " + this.name + " " + this.lastName
    }

    get createDate() {
        return moment(this.createdAt).format("DD.MM.YYYY");
    }

    get createTime() {
        return moment(this.createdAt).format("HH:mm");
    }

    get updateDate() {
        return moment(this.updatedAt).format("DD.MM.YYYY");
    }

    get updateTime() {
        return moment(this.updatedAt).format("HH:mm");
    }
}