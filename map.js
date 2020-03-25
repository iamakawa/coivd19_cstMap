var NumAllEvtCount;
var NumTodayEvtCount;
var CancelledEvtList =
    "https://script.google.com/macros/s/AKfycbz51mpjVZ-XfHTti5Q-fFwzHaRaY_P1ZajawHXxnXnZsynYBq17/exec";
var JSON_Origin = {};

var map = L.map("map", { zoomControl: false }).fitWorld();
var geoJsonLayer;

window.onload = function() {
    var loading = document.getElementById("loading");
    loading.classList.remove("hidden");
    map.setView([35.71, 139.75], 6);
    L.tileLayer(
        "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw", {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: "mapbox/streets-v11",
            tileSize: 512,
            zoomOffset: -1
        }
    ).addTo(map);
    fetch(CancelledEvtList)
        .then(function(response) {
            return response.json();
        })
        .then(function(myJson) {
            JSON_Origin = Object.create(myJson);
            countReset();
            var JSON_Merged = {};
            JSON_Merged = Object.create(concatJSON(JSON_Origin));
            geoJsonLayer = L.geoJSON(JSON_Merged, {
                style: function(feature) {
                    return feature.properties && feature.properties.style;
                },
                onEachFeature: onEachFeature
            }).addTo(map);
            refelshInfo();
            loading.classList.add("hidden");
        });
    var searchboxControl = createSearchboxControl();
    var control = new searchboxControl();
    control._searchfunctionCallBack = execFilltering;
    map.addControl(control);
};

var eventinfo = L.control({ position: "bottomright" });
eventinfo.onAdd = function(map) {
    this.ele = L.DomUtil.create("div", "infostyle");
    this.ele.id = "infodiv";
    return this.ele;
};
eventinfo.addTo(map);

var zoom = L.control.zoom({ position: "bottomright" });
zoom.addTo(map);

function execFilltering(e) {
    var JSON_Filtered = {};
    var JSON_Merged = {};
    geoJsonLayer.clearLayers();
    countReset();
    var searchbox = document.querySelector("input");
    JSON_Filtered = Object.create(fillteringJSON(JSON_Origin, searchbox.value));
    JSON_Merged = Object.create(concatJSON(JSON_Filtered));
    geoJsonLayer = L.geoJSON(JSON_Merged, {
        style: function(feature) {
            return feature.properties && feature.properties.style;
        },
        onEachFeature: onEachFeature
    }).addTo(map);
    refelshInfo();
}

function onEachFeature(feature, layer) {
    var popupContent =
        "<b>" +
        feature.properties.name +
        "</b><br>" +
        feature.properties.address +
        "<table>";

    for (i = 0; i < feature.properties.classification.length; i++) {
        popupContent +=
            "<tr><td>" +
            feature.properties.classification[i] +
            "</td><td>" +
            feature.properties.date[i] +
            '</td><td><a href="' +
            feature.properties.URL[i] +
            '">' +
            feature.properties.event_name[i] +
            "</a></td><td>" +
            feature.properties.facility[i] +
            "</td></tr>";

        NumAllEvtCount++;
        if (feature.properties.date[i] == getNowYMD()) {
            NumTodayEvtCount++;
        }
    }
    popupContent += "</table>";

    if (feature.properties && feature.properties.popupContent) {
        popupContent += feature.properties.popupContent;
    }

    layer.bindPopup(popupContent);
}

function refelshInfo() {
    //地図上を移動した際にdiv中に緯度経度を表示
    var box = document.getElementById("infodiv");
    var html =
        '<font color="red">中止・延期イベント総数   :' +
        NumAllEvtCount +
        "</font><br>" +
        '<font color="green">本日の中止・延期イベント :' +
        NumTodayEvtCount +
        "</font>";
    box.innerHTML = html;
    box.style.visibility = "visible";
}

function getNowYMD() {
    var dt = new Date();
    var y = dt.getFullYear();
    var m = ("00" + (dt.getMonth() + 1)).slice(-2);
    var d = ("00" + dt.getDate()).slice(-2);
    var result = y + "/" + m + "/" + d;
    return result;
}

function countReset() {
    NumAllEvtCount = 0;
    NumTodayEvtCount = 0;
}

function fillteringJSON(JSON_arg, value) {
    var JSON_res = {};
    var JSON_ref = JSON_arg.features;
    var cnt = 0;

    JSON_res.type = "FeatureCollection";
    JSON_res.features = [];
    for (var i = 0; i < JSON_ref.length; i++) {
        var target =
            JSON_ref[i].properties.name +
            " " +
            JSON_ref[i].properties.address +
            " " +
            JSON_ref[i].properties.prefecture +
            " " +
            JSON_ref[i].properties.classification +
            " " +
            JSON_ref[i].properties.date +
            " " +
            JSON_ref[i].properties.event_name +
            " " +
            JSON_ref[i].properties.facility;

        if (target.match(value)) {
            JSON_res.features.push(JSON_ref[i]);
            cnt++;
        }
    }
    return JSON_res;
}

function concatJSON(JSON_arg) {
    var JSON_res = {};
    var JSON_ref = JSON_arg.features;
    var cnt = 0;

    JSON_res.type = "FeatureCollection";
    JSON_res.features = [];
    for (var i = 0; i < JSON_ref.length; i++) {
        if (
            i > 0 &&
            JSON_ref[i - 1].properties.name == JSON_ref[i].properties.name &&
            JSON_ref[i - 1].properties.address == JSON_ref[i].properties.address
        ) {
            JSON_res.features[cnt - 1].properties.classification.push(
                JSON_ref[i].properties.classification
            );
            JSON_res.features[cnt - 1].properties.date.push(
                JSON_ref[i].properties.date
            );
            JSON_res.features[cnt - 1].properties.event_name.push(
                JSON_ref[i].properties.event_name
            );
            JSON_res.features[cnt - 1].properties.facility.push(
                JSON_ref[i].properties.facility
            );
            JSON_res.features[cnt - 1].properties.URL.push(
                JSON_ref[i].properties.URL
            );
        } else {
            var obj = {};
            obj.type = "Feature";
            obj.properties = {};
            obj.properties.name = JSON_ref[i].properties.name;
            obj.properties.address = JSON_ref[i].properties.address;
            obj.properties.prefecture = JSON_ref[i].properties.prefecture;

            obj.geometry = {};
            obj.geometry.type = "Point";
            obj.geometry.coordinates = [];
            obj.geometry.coordinates.push(
                JSON_ref[i].geometry.coordinates[0],
                JSON_ref[i].geometry.coordinates[1]
            );

            obj.properties.classification = [JSON_ref[i].properties.classification];
            obj.properties.date = [JSON_ref[i].properties.date];
            obj.properties.event_name = [JSON_ref[i].properties.event_name];
            obj.properties.facility = [JSON_ref[i].properties.facility];
            obj.properties.URL = [JSON_ref[i].properties.URL];
            JSON_res.features.push(obj);
            cnt++;
        }
    }
    return JSON_res;
}