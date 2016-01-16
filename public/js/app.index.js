function hideCategoryPopup(){
    $("#category-popup").hide();
    $("#edit-category-name").val("");
    $("#edit-category-icon").val("");
    $("#edit-category-id").val("");
};

function updateCategory(cat){
    $("#cat-icon-"+cat._id).attr("src", cat.icon);
    $("#cat-name-"+cat._id).html(cat.name);
}

function sendEditCategory(){
    var name_input = $("#edit-category-name");
    var icon_input = $("#edit-category-icon");
    var name = (name_input.val()) ? name_input.val(): name_input.attr('placeholder');
    var icon = (icon_input.val()) ? icon_input.val(): icon_input.attr('placeholder');
    var id= $("#edit-category-id").val();
    var sendInfo = {
        name: name,
        icon: icon
    };
    $.ajax({
        type: "POST",
        url: "/edit_category/"+id,
        dataType: "json",
        data: sendInfo,
        success: function(cat){
            hideCategoryPopup();
            updateCategory(cat);
        },
        error: function(msg){
            alert(JSON.stringify(msg));
        }
    });
}

$("#category-popup").click(hideCategoryPopup);
$("#category-form").click(function(event){
    event.preventDefault();
    event.stopPropagation();
});
$("#edit-category").click(sendEditCategory);


function editMap(id){
    window.location.href="/edit_map/"+id;
}

function deleteMap(id){
    $.ajax({
        type: "GET",
        url:  "/delete_map/"+id,
        success: function (res){
            $("#map-item-"+id).remove();                
        },
        error: function(msg){
            alert(JSON.stringify(msg));
        }
    });

}

function editCategory(id){
    $("#category-popup").show();
    $("#edit-category-name").attr("placeholder",$("#cat-name-"+id).html());
    $("#edit-category-icon").attr("placeholder",$("#cat-icon-"+id).attr('src'));
    $("#edit-category-id").val(id);
}

function deleteCategory(id){
    $.ajax({
        type: "GET",
        url:  "/delete_category/"+id,
        success: function (res){
            $("#cat-item-"+id).remove();                
        },
        error: function(msg){
            alert(JSON.stringify(msg));
        }
    });

}


function addMap(map){

    v = $('<div class="map-item" id="map-item-'+map._id+'">');
    vignette = "<div class=\"map-item-icon\"><img src=\"https://upload.wikimedia.org/wikipedia/en/1/19/Google_Maps_Icon.png\" /></div>";
    vignette += "<div class=\"map-item-text\">" + map.name + "</div>";
    vignette += "<div class=\"map-delete\" onclick=\"deleteMap('"+map._id+"')\"><img src=\"http://uxrepo.com/static/icon-sets/ionicons/svg/ios7-trash-outline.svg\" /></div>";
    vignette += "<div class=\"map-edit\" onclick=\"editMap('"+map._id+"')\"><img src=\"https://cdn2.iconfinder.com/data/icons/windows-8-metro-style/512/edit.png\" /></div>";
    v.html(vignette);
    v.insertBefore($("#map-new-item"));
}

function addCategory(cat){

    v = $('<div class="map-item" id="cat-item-'+cat._id+'">');
    vignette = "<div class=\"map-item-icon\"><img src=\""+cat.icon+"\" id=\"cat-icon-"+cat._id+"\" /></div>";
    vignette += "<div class=\"map-item-text\" id=\"cat-name-"+cat._id+"\">" + cat.name + "</div>";
    vignette += "<div class=\"map-delete\" onclick=\"deleteCategory('"+cat._id+"')\"><img src=\"http://uxrepo.com/static/icon-sets/ionicons/svg/ios7-trash-outline.svg\" /></div>";
    vignette += "<div class=\"map-edit\" onclick=\"editCategory('"+cat._id+"')\"><img src=\"https://cdn2.iconfinder.com/data/icons/windows-8-metro-style/512/edit.png\" /></div>";
    v.html(vignette);
    v.insertBefore($("#cat-new-item"));
}


$("#map-new-item").on("click",function(){
    $("#map-new-item-img").hide();
    $("#map-new-item-form").show();
});

$("#cat-new-item").on("click",function(){
    $("#cat-new-item-img").hide();
    $("#cat-new-item-form").show();
});

$("#create-map").on("click", function(){
    var name = $("#map-name").val();
    
    var sendInfo = {
        name: name
    };
    
    $.ajax({
       type: "POST",
       url: "/create_map",
       dataType: "json",
       success: function (res) {
           addMap(res.map);
           $("#map-new-item-img").show();
           $("#map-new-item-form").hide();
       },
       error: function(msg){
            alert(JSON.stringify(msg));
        },
       data: sendInfo
   });
});

$("#create-category").on("click",function(){
    var name = $("#category-name").val();
    var icon = $("#category-icon").val();
    if(name && icon){
        var sendInfo = {
            name: name,
            icon: icon
        }
        $.ajax({
            type: "POST",
            url: "/create_category",
            dataType: "json",
            success: function (res){
                addCategory(res.category);
               $("#cat-new-item-img").show();
               $("#cat-new-item-form").hide();
            },
            error: function(msg){
                alert(JSON.stringify(msg));
            },
            data: sendInfo
        });
    }
});


$.ajax({
    type:"GET",
    url: "/maps",
    success: function (data) {
        var maps= JSON.parse(data);
        for (var i=0; i<maps.length; i++){
            addMap(maps[i]);
        }
    },
    error: function(msg){
        alert(JSON.stringify(msg));
    }
});

$.ajax({
    type:"GET",
    url: "/categories",
    success: function (data) {
        var cats = JSON.parse(data);
        for (var i=0; i<cats.length; i++){
            addCategory(cats[i]);
        }
    },
    error: function(msg){
        alert(JSON.stringify(msg));
    }        
});
