var view = amaltea.view({
    tagName: 'my-tag',
    template: "views/main.html",
    stylesheet: "views/style.css"
});

var http = amaltea.object('sos', { kek: 420 });

var presenter = view.presenter('mainPresenter', function ($view, $model, http) {
    return {
        text: "",

        initText: function () {
            this.text = "Hello";
        }
    };
}, ['$view', '$model', 'http']);

var userModel = presenter.model('User', {
    username: "text",
    password: "text",
    email: "text"
});

var taskModel = presenter.model('Task', {
    id: "number",
    name: "text",
    desciption: "text"
});

var module = amaltea.module("main", [view], [http]);