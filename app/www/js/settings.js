App = window.App;
// Create "App" global variable if it doesn't exists already. 
if(!App){
    App = {};
}
// Settings.
window.App.Settings = {
    server: {
        url: "http://ourconcepts.serverict.nl/",
        apis: {
            length: 3,
            menu : {
                db: 'defaults',
                params: {
                    type: 'menu'
                },
                url: '?json=get_menu_structure&callback=?'
            },
            page: {
                db: 'pages',
                params: {
                },
                url: "?json=get_page&id={{page.object_id}}&callback=?",
                findId:'',
            },
            posts: {
                db: "posts",
                params:{
                },
                url: "?json=get_posts&callback=?",
                findId: ''
            }
        }
    },
    database: {
        name: "ourconcepts",
        version: "1.0",
        displayName: "OurconceptsApp-Database",
        size: 5 * 1024 * 1024, // 5MB
        table: {
            length: 3,
            defaults: {
                type: "type unique",
                data: "data"
            },
            pages: {
                id: "id unique",
                data: "data"
            },
            posts: {
                id: "id unique",
                data: "data"
            }
        }
    },
    views: { // Automatic prepended "#" (Only html elements with id's!)
        page: "page",
        news: "news"
    }
};