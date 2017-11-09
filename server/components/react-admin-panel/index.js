module.exports = function reactAdminPanelComponent(loopbackApplication, options) {
    for (var key in loopbackApplication.models) {
        var model = loopbackApplication.models[key];
    }

    console.log(model);
}
