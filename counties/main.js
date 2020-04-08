

function addCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


(function() {

    var expression = "covid";

    var colors = { "covid":"Reds","beds":"Blues","smokers":"Purples","deaths":"Oranges","poverty":"Greens"};

    var ramp = colors[expression];
    
    var labels = { "covid":"COVID-19 cases per 1,000 residents","beds":"Hospital beds per 1,000 residents","smokers":"Smoking rate","deaths":"COVID-19 deaths per 1,000 residents","poverty":"Poverty rate"};
    
	var width = $(".usmap").width(),
       margin = { top:20, right:0, bottom: 45, left: 55 },
       scatterwidth = width,
       scatterheight = width*.3;

    
    function setMap() { 
        
        d3.select(".maplabel").text(labels[expression]);

    	var height = width*.6;
    	    
    
    	var projection = d3.geoAlbersUsa()
    	    .scale([width*1.2])
            .translate([(width/2)+3, (height/2)]);
    	
    	var path = d3.geoPath()
    	    .projection(projection);
    	
    	var svg = d3.select(".usmap").append("svg")
    	    .attr("width", width)
    	    .attr("height", height);
    	    
        d3.queue()
            .defer(d3.json,"data/counties-10m.json")
            .defer(d3.json,"data/data.json")
            .await(ready)
    
        function ready(error, us, data) {
            
          if (error) return console.error(error);
          
          var countydata = [];
          var domainArray = [];
          data.forEach(function(d) {
            countydata[d.id] = d;
            countydata[d.id]['covid_rate'] = d.confirmed/d.population*1000;
            countydata[d.id]['beds_rate'] = d.beds/d.population*1000;
            countydata[d.id]['smokers_rate'] = d.smokers_pct;
            countydata[d.id]['deaths_rate'] = d.deaths/d.population*1000;
            countydata[d.id]['poverty_rate'] = d.poverty/d.population*100;
            var val = parseFloat(countydata[d.id][expression+'_rate']);
            domainArray.push(val);
          });                
    
          
          
          var counties = us.objects.counties.geometries;
          counties.forEach(function(d) {
              d.properties = countydata[d.id];
          })                 
        
        
        
          var colorScale = makeColorScale(domainArray,ramp);
        
        
           
          svg.append("g")
              .attr("class", "land")
            .selectAll("path")
               .data(topojson.feature(us, us.objects.states).features)
            .enter().append("path")
              .attr("d", path);
              
          svg.append("path")
              .datum(topojson.mesh(us, us.objects.counties, function(a, b) { return a !== b; }))
              .attr("class", "border border--county")
              .attr("d", path);
    
           svg.append("g")
            .selectAll("path")
               .data(topojson.feature(us, us.objects.counties).features)
            .enter().append("path")
              .attr("d", path)
              .attr("class", function(d) {
                  var cid = +d.id;
                  return "counties fips_"+cid;
              })
    		      .style("fill", function(d) {
     		      if (d.properties[expression+"_rate"]>0) { 
                   var val = d.properties[expression+"_rate"];
                   return colorScale(val);
                   
                   } else {
                       return "#ccc";
                   }
     		      })
    		   .on("mouseover", function(d) {
    			   highlight(d.properties);
    			   d3.select(".usmap .maptip")
    			        .classed("hideit", false);		
    		   })
     		       .on("mouseout", function(d) {
    	 		       dehighlight(d.properties);
    			   d3.select(".usmap .maptip")
    			     .classed("hideit", true);
    		   })
    		   	
    
    		   .on("mousemove", function(d) {
    			   var rightlimit = width-200;
    			   var mousep = d3.mouse(this);
    				var xPosition = mousep[0];
    				var yPosition = mousep[1];
    				var yPos = yPosition-80;
    				var xPos = xPosition+10;
    				if (xPos<0) { 
    					xPos = 0; 
    		        } else if (xPos>rightlimit) {
    			        xPos = xPosition-160;
    		        }
                    var text = mapTip(d.properties);							
    
    				d3.select(".usmap .maptip")
    					.style("left", xPos + "px")
    					.style("top", yPos + "px")				
    		   		d3.select(".usmap .maptip")
    		   		  .html(text);
    		   });
    
             
          svg.append("path")
              .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
              .attr("class", "border border--state")
              .attr("d", path);
              
          svg.append("g")
            .attr("class","legendQuant")
            .attr("transform","translate("+(width-80)+","+(height-90)+")");
            
          makeLegend(colorScale);
            
            setChart(data,expression);
            var buttontext = "<div class='btn-group btn-group-sm btn-group-toggle covidmap' data-toggle='buttons'>"
                    +   "<label class='btn btn-outline-secondary btn-sm active' data-type='covid'>"
                    +     "<input type='radio' class='covid' data-type='covid' name='options' id='option1' autocomplete='off' checked> COVID-19"
                    +  "</label>"
                    +  "<label class='btn btn-outline-secondary btn-sm'>"
                    +    "<input type='radio' name='options' class='deaths' data-type='deaths' id='option4' autocomplete='off'> COVID-19 deaths"
                    +  "</label>"
                    +  "<label class='btn btn-outline-secondary btn-sm'>"
                    +    "<input type='radio' name='options' class='beds' data-type='beds' id='option2' autocomplete='off'> Hospital beds"
                    +  "</label>"
                    +  "<label class='btn btn-outline-secondary btn-sm'>"
                    +    "<input type='radio' name='options' class='smokers' data-type='smokers' id='option3' autocomplete='off'> Smokers"
                    +  "</label>"
                    +  "<label class='btn btn-outline-secondary btn-sm'>"
                    +    "<input type='radio' name='options' class='poverty' data-type='poverty' id='option5' autocomplete='off'> Poverty"
                    +  "</label>"
                    + "</div>";
            
            d3.select(".allbuttons")
                .html(buttontext);
                
            d3.selectAll(".covidmap input")
                .on("click",function(d) {
                    var expression = d3.select(this).attr("data-type");
                    changeAttribute(expression,data);
                });
            
            

            
            

        }
    }
    
        function makeColorScale(domainArray,ramp) {
            var colorScale = d3.scaleQuantile()
    	        .range(colorbrewer[ramp][6])
                .domain(domainArray);
            return colorScale;

        };
        
      function setChart(data,expression) {
            var ramp = colors[expression];
            var x = d3.scaleLinear()
                .range([0, scatterwidth]);
                
            var y = d3.scaleLinear()
                .range([scatterheight, 0]);
                
            var xAxis = d3.axisBottom(x).ticks(5);
            
            var yAxis = d3.axisLeft(y).ticks(5);
            
            var zoom = d3.zoom()
                .scaleExtent([.5,20])
                .extent([[0,0], [scatterwidth,scatterheight]])
                .on("zoom", zoomed);
                
            
    		var ssvg = d3.select(".scatter").append("svg")
    		    .attr("width", scatterwidth)
    		    .attr("height",scatterheight+margin.top+margin.bottom)
    		  .append("g")
    		    .attr("transform","translate("+margin.left+","+margin.top+")");
    		    
    		var clip = ssvg.append("defs").append("svg:clipPath")
            	.attr("id", "clip")
            	.append("svg:rect")
            	.attr("width", scatterwidth)
            	.attr("height", scatterheight)
            	.attr("x", 0)
            	.attr("y", 0);
            	
            ssvg.append("rect")
                .attr("width", scatterwidth)
                .attr("height", scatterheight)
                .style("fill", "none")
                .style("pointer-events", "all")
                .attr("transform", "translate("+margin.left+","+margin.top+")")
                .call(zoom);
    
    		var xmax = d3.max(data, function (d) { return d.population; })/2;
        	var minmax = [
                d3.min(data, function(d) { return parseFloat(d[expression+"_rate"]); }),
                d3.max(data, function(d) { return parseFloat(d[expression+"_rate"]); })
            ];
            x.domain([0, xmax]).nice();
            y.domain(minmax).nice();
    	
            var scatter = ssvg.append("g")
                .attr("id","scatterplot")
                .attr("clip-path","url(#clip)");
    	
           scatter.selectAll(".dot")
              .data(data)
            .enter().append("circle")
              .attr("class", function(d) {
                  return "dot fips_"+d.id;
              })
              .attr("r", 3.5)
              .attr("cx", function(d) { return x(d.population); })
              .attr("cy", function(d) { return y(d[expression+"_rate"]); })
              .style("fill", colorbrewer[ramp][6][5])
              .on("mouseover",function(d) {
                   highlight(d);
                   d3.select(".scatter .maptip")
    			        .classed("hideit", false);		
    
    			   var rightlimit = width-200;
    			   var mousep = d3.mouse(this);
    				var xPosition = mousep[0];
    				var yPosition = mousep[1];
    				var yPos = yPosition-160;
    				var xPos = xPosition-20;
    				if (xPos<0) { 
    					xPos = 0; 
    		        } else if (xPos>rightlimit) {
    			        xPos = xPosition-40;
    		        }
                    var text = mapTip(d);							
    
    				d3.select(".scatter .maptip")
    					.style("left", xPos + "px")
    					.style("top", yPos + "px")				
    		   		d3.select(".scatter .maptip")
    		   		  .html(text);
             })
              .on("mouseout",function(d) {
                  dehighlight(d);
                 d3.select(".scatter .maptip")
    			        .classed("hideit", true);		
              });
    		
          ssvg.append("g")
              .attr("class", "x axis")
              .attr("id","axis--x")
              .attr("transform", "translate(0," + scatterheight + ")")
              .call(xAxis);
              
          ssvg.append("text")
            .attr("class","axislabel")
            .attr("transform","translate("+(scatterwidth/2)+" ,"+(scatterheight+margin.top+20)+")")
            .style("text-anchor","middle")
            .text("County Population");
        
          ssvg.append("g")
              .attr("class", "y axis")
              .attr("id","axis--y")
              .call(yAxis);
    
          ssvg.append("text")
            .attr("class","axislabel")
            .attr("transform","rotate(-90)")
            .attr("y",10-margin.left)
            .attr("x",0-(scatterheight/2))
            .style("text-anchor","middle")
            .text(labels[expression]);
                              
    
            
            var k = 1;
            
            
    
            function zoomed() {
                var new_x = d3.event.transform.rescaleX(x);
                var new_y = d3.event.transform.rescaleY(y);
                ssvg.select("#axis--x").call(xAxis.scale(new_x));
                ssvg.select("#axis--y").call(yAxis.scale(new_y));
                scatter.selectAll("circle")
                .attr("cx", function (d) { return new_x(d.population); })
                .attr("cy", function (d) { return new_y(d[expression+"_rate"]); });
                k = d3.event.transform.k;
                console.log(k);
            }
    
    
            function reset() {
                var t = ssvg.transition().duration(500);
                ssvg.select("#axis--x").transition(t).call(xAxis.scale(x));
                ssvg.select("#axis--y").transition(t).call(yAxis.scale(y));
                scatter.selectAll("circle").transition(t)
                .attr("cx", function (d) { return x(d.population); })
                .attr("cy", function (d) { return y(d[expression+"_rate"]); });
            }
    
            $(".reset").on("click",function() {
                reset();
            })
        }
      
      
        function changeAttribute(attribute,data) {
            expressed = attribute;
            d3.select(".maplabel").text(labels[expressed]);
            var countydata = [];
            var domainArray = [];
            data.forEach(function(d) {
            countydata[d.id] = d;
            countydata[d.id]['covid_rate'] = d.confirmed/d.population*1000;
            countydata[d.id]['beds_rate'] = d.beds/d.population*1000;
            countydata[d.id]['smokers_rate'] = d.smokers_pct;
            countydata[d.id]['deaths_rate'] = d.deaths/d.population*1000;
            countydata[d.id]['poverty_rate'] = d.poverty/d.population*100;
            var val = parseFloat(countydata[d.id][expressed+'_rate']);
            domainArray.push(val);
            });                
            var ramp = colors[expressed];
            var colorScale = makeColorScale(domainArray,ramp);
            
    		var counties = d3.selectAll(".counties")
    		    .transition()
    		    .duration(1000)
    		    .style("fill", function(d) {
     		       if (d.properties[expressed+"_rate"]>0) { 
                        var val = d.properties[expressed+"_rate"];
                        return colorScale(val);
                   } else {
                       return "#ccc";
                   }
     		    });
            makeLegend(colorScale);
            d3.select(".scatter svg").remove();
            setChart(data,expressed);
          
        }
        
        
        
        
        function makeLegend(colorScale) {
             var legend = d3.legendColor()
                .labelFormat(d3.format(".2f"))
                .cellFilter(function(d) { return d.label !== '0.00 - 0.00' })
                .shapeWidth(10)
                .shapeHeight(10)
                .labelDelimiter("-")
                .shapePadding(0)
                .labelOffset(5)
                .scale(colorScale);
                
            d3.select(".legendQuant")
                .call(legend);
        }
        

        function highlight(props) {
           id = +props.id;
		   d3.selectAll(".fips_"+id)
		     .moveToFront()
		     .classed("active",true);
        }
        function dehighlight(props) {
           id = +props.id;
		   d3.selectAll(".fips_"+id)
		     .moveToBack()
		     .classed("active",false);
        }

		d3.selection.prototype.moveToFront = function() {
		  return this.each(function() {
			  this.parentNode.appendChild(this);
		  });
		};
		
		d3.selection.prototype.moveToBack = function() {  
		    return this.each(function() { 
		        var firstChild = this.parentNode.firstChild; 
		        if (firstChild) { 
		            this.parentNode.insertBefore(this, firstChild); 
		        } 
		    });
		};
		
		function mapTip(props) {
			var confirmed = props.confirmed;
			var deaths = props.deaths;
        	var countyname = props.county+", "+props.state;
        	var population = props.population;
        	var smokers = props.smokers_pct;
        	var beds = props.beds;
        	var poverty = props.poverty;
        	var covid_rate = props.covid_rate;
			var poverty_rate = props.poverty_rate;
			var bed_rate = props.beds_rate;
            var text = "<div class='popname'>"+countyname+"</div>"
                + "<div class='poptext'>COVID-19 cases: <strong>"+addCommas(confirmed)+"</strong></div>"
                + "<div class='poptext'>Cases per 10,000: <strong>"+covid_rate.toFixed(1)+"</strong></div>"
                + "<div class='poptext'>Deaths: <strong>"+addCommas(deaths)+"</strong></div>"
                + "<div class='poptext'>Population: <strong>"+addCommas(population)+"</strong></div>"
                + "<div class='poptext'>Poverty rate: <strong>"+poverty_rate.toFixed(1)+"%</strong></div>"
                + "<div class='poptext'>Smoking rate: <strong>"+smokers.toFixed(1)+"%</strong></div>"
                + "<div class='poptext'>Hospital beds per 1,000: <strong>"+bed_rate.toFixed(1)+"</strong></div>";
             return text;
        }

       setMap();
})();







