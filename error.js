export default class Error {
    constructor(field, message) {
        this.field = field
        this.message = message
    }

    get errorText() {
        return this.message + ". "
    }

}