App.Core = {
    initialize: function(){
        this.bindEvents();
    },
    // Start listening for some events.
    bindEvents: function(){
        // REPLACE THE 5 lines of code with the 1 line (outcommented) for production!
        //document.addEventListener('deviceready', App.Event.onDeviceReady);
        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
            document.addEventListener("deviceready", App.Event.onDeviceReady, false);
        } else {
            App.Event.onDeviceReady();
        }
    },
}; // End of App

App.Event = {
    onDeviceReady: function(){
        alert('Device Ready!');
    },
};// End of App.Event

App.View = {
    views: App.Settings.views,
    cur: [], // The current open views.
    open: function(view){
        this.cur.push(view);
        $('.view').css('z-index', 9);
        $('#'+view)
            .css('z-index',999)
            .removeClass('side');
    },
    pop: function(){
    }
}; // End of App.View