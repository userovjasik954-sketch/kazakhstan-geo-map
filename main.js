var map = L.map('map').setView([48.0196, 66.9237], 5);
var geojsonLayer;
var csvDataGlobal;
var currentYear = '2025';

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Расширенная палитра для более красивой раскраски
function getColor(d) {
    return d > 1000000 ? '#4a0000' :
           d > 500000  ? '#800026' :
           d > 300000  ? '#BD0026' :
           d > 150000  ? '#E31A1C' :
           d > 80000   ? '#FC4E2A' :
           d > 40000   ? '#FD8D3C' :
           d > 15000   ? '#FEB24C' :
           d > 5000    ? '#FED976' :
           d > 0       ? '#FFEDA0' :
                         '#e0e0e0'; 
}

function updateYear(year) {
    currentYear = year;
    // Обновляем кнопки в HTML (убедись, что у них есть id btn2000 и btn2025)
    if(document.getElementById('btn2000')) document.getElementById('btn2000').classList.toggle('active', year === '2000');
    if(document.getElementById('btn2025')) document.getElementById('btn2025').classList.toggle('active', year === '2025');

    if (geojsonLayer) {
        geojsonLayer.eachLayer(function(layer) {
            var dName = layer.feature.properties.district;
            var row = csvDataGlobal.find(r => r.District === dName);
            var value = row ? parseInt(row[currentYear]) : 0;
            
            layer.setStyle({
                fillColor: getColor(value),
                fillOpacity: value > 0 ? 0.8 : 0.1
            });
            layer.setPopupContent(`<b>District:</b> ${dName}<br><b>Population ${currentYear}:</b> ${value.toLocaleString()}`);
        });
    }
}

async function init() {
    try {
        const [csvRes, geoRes] = await Promise.all([fetch('/api/data'), fetch('/static/data.geojson')]);
        csvDataGlobal = await csvRes.json();
        const geojsonData = await geoRes.json();

        geojsonLayer = L.geoJson(geojsonData, {
            style: function(feature) {
                var dName = feature.properties.district;
                var row = csvDataGlobal.find(r => r.District === dName);
                var value = row ? parseInt(row[currentYear]) : 0;
                return {
                    fillColor: getColor(value),
                    weight: 0.4, 
                    color: 'black', 
                    fillOpacity: value > 0 ? 0.8 : 0.1
                };
            },
            onEachFeature: function(feature, layer) {
                var dName = feature.properties.district;
                var row = csvDataGlobal.find(r => r.District === dName);
                var value = row ? parseInt(row[currentYear]) : 0;
                layer.bindPopup(`<b>District:</b> ${dName}<br><b>Population ${currentYear}:</b> ${value.toLocaleString()}`);
                
                layer.on({
                    mouseover: function(e) { e.target.setStyle({ weight: 2, color: '#666' }); },
                    mouseout: function(e) { geojsonLayer.resetStyle(e.target); }
                });
            }
        }).addTo(map);

    } catch (e) {
        console.error("Initialization error:", e);
    }
}

// Легенда
var legend = L.control({position: 'bottomright'});
legend.onAdd = function () {
    var div = L.DomUtil.create('div', 'info legend');
    var grades = [0, 15000, 40000, 80000, 150000, 300000, 500000, 1000000];
    div.style.background = 'white'; div.style.padding = '10px'; div.style.borderRadius = '5px';
    div.innerHTML = '<b>Population</b><br>';
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML += '<i style="background:' + getColor(grades[i] + 1) + '; width:15px; height:15px; float:left; margin-right:5px;"></i> ' +
            grades[i].toLocaleString() + (grades[i + 1] ? '&ndash;' + grades[i + 1].toLocaleString() + '<br>' : '+');
    }
    return div;
};
legend.addTo(map);

init();