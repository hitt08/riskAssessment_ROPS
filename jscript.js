var entities = new Object();
var eventsProb = {"pr_nofire":0.1,"pr_nomac":0.1,"pr_crmac":0.1,"pr_noairdata":0.1,"pr_nosensordata":0.1,"pr_noenvdata":0.1,"pr_oldenvdata":0.1,"pr_norundata":0.1,"pr_oldrundata":0.1,"pr_noresmon":0.1,"pr_nobackup":0.1,"pr_nohot":0.1};
var prior_str="";

function refresh_checks(){
	for ( e in entities)
		document.getElementById(e).checked=entities[e];
}

function toggle_hide(elm,chk_elm,span_elm){
	if (elm.checked && span_elm!="")
		document.getElementById(span_elm).style.visibility="visible";
	else{
		if(span_elm!="")
			document.getElementById(span_elm).style.visibility="hidden";
		document.getElementById(chk_elm).checked="";
		entities[chk_elm]=false;
	}
}

function toggle_chk(elm,chk_elm){
	for( chk in chk_elm){
		document.getElementById(chk_elm[chk]).checked=elm.checked;
		entities[chk_elm[chk]]=elm.checked;
	}
}
function update_conf(elm) {
  entities[elm.id]=elm.checked;
  switch(elm.id){
	case "chk_store_ntw":
		if(entities["chk_store_pub"])
			toggle_hide(elm,"chk_store_fire","store_fire");
		toggle_hide(elm,"chk_store_pub","store_pub");
		
		break;
	case "chk_store_pub":
		toggle_hide(elm,"chk_store_fire","store_fire");
		break;
	case "chk_store_fire":
		if(entities["chk_store_airdata"])
			toggle_chk(elm,["chk_fire_airdata"]);
		if(entities["chk_store_sensordata"])
			toggle_chk(elm,["chk_fire_sensordata"]);
		break;
	case "chk_airdata_store":
		if(entities["chk_store_fire"])
			toggle_chk(elm,["chk_store_airdata","chk_fire_airdata"]);
		else
			toggle_chk(elm,["chk_store_airdata"]);
		break;
	case "chk_sensordata_store":
		if(entities["chk_store_fire"])
			toggle_chk(elm,["chk_store_sensordata","chk_fire_sensordata"]);
		else
			toggle_chk(elm,["chk_store_sensordata"]);
		break;
	case "chk_mal_mainntw":
	case "chk_dos_mainntw":
		var base=elm.id.split("_")[1];
		toggle_hide(elm,"chk_"+base+"_fire",base+"_fire");
		if(!elm.checked && (elm.checked || !(entities["chk_dos_mainntw"] || entities["chk_mal_mainntw"]) ))
			toggle_chk(elm,["chk_fire_mainntw"]);
		break;
	case "chk_mal_fire":
	case "chk_dos_fire":
		if(elm.checked || !(entities["chk_dos_fire"] || entities["chk_mal_fire"]) )
			toggle_chk(elm,["chk_fire_mainntw"]);
		break;	
  }
  
  var x="";
  for (c in entities){
  x+=c+":" +entities[c] + "<br>";
  }
 }
 function capture_val(e,elm){
	prior_str=elm.value;
	if(e.keyCode > 31 && (e.keyCode < 48 || e.keyCode > 57)){
		e.preventDefault();
	}
 }
 function calc_probability(elm) {
   if(!isFinite(elm.value)){
	if(!isFinite(prior_str)){
		elm.value="";
	}else{
	   elm.value=prior_str;
	}
   }
	var base=elm.id.split("_")[1];
	var f=document.getElementById("f_"+base);
	var t=document.getElementById("t_"+base);
	var pr=document.getElementById("pr_"+base);
	if(f.value=="" || t.value=="" || t.value=="0"){
		pr.innerHTML=0;
	}else{
		var div=(f.value/t.value).toFixed(9);
		if(div>1){
			div=1;
		}
		pr.innerHTML=parseFloat(div);
	}
	eventsProb[pr.id]=pr.innerHTML;
	var x="";
	for (c in eventsProb){
		x+=c+":" +eventsProb[c] + "<br>";
	}
 }
 
 function bool_to_int(bool){
	if(bool)
		return 1
	else 
		return 0
 }
 
 function ceil_to_one(val){
	if(val>1)
		return 1
	else
		return val;
 }
 function calc_prob(){
	var prob_backup=ceil_to_one(parseFloat(eventsProb["pr_nobackup"])+parseFloat(eventsProb["pr_nohot"]));
	var prob_dos=ceil_to_one(parseFloat(eventsProb["pr_noresmon"]));
	var prob_sensor=ceil_to_one(parseFloat(eventsProb["pr_nosensordata"]));
	var prob_env=ceil_to_one(parseFloat(eventsProb["pr_noenvdata"])+parseFloat(eventsProb["pr_oldenvdata"]));
	var prob_run=ceil_to_one(parseFloat(eventsProb["pr_norundata"])+parseFloat(eventsProb["pr_oldenvdata"]));
	var prob_fire=ceil_to_one(parseFloat(eventsProb["pr_nofire"])+parseFloat(eventsProb["pr_nomac"])+parseFloat(eventsProb["pr_crmac"]));
	var prob_air=ceil_to_one(parseFloat(eventsProb["pr_noairdata"]));
	
	var prob_store=bool_to_int(entities["chk_store_ntw"] && entities["chk_store_pub"] && entities["chk_store_fire"]) * prob_fire;
	
	prob_air=ceil_to_one(prob_air + (bool_to_int(entities["chk_airdata_store"]) * prob_store));
	prob_sensor=ceil_to_one(prob_sensor+(bool_to_int(entities["chk_sensordata_store"]) * prob_store));
	
	var prob_inacc=ceil_to_one(prob_air+prob_run+prob_env+prob_sensor);
	
	var prob_malware=bool_to_int(entities["chk_mal_mainntw"] && entities["chk_mal_fire"]) * prob_fire;
	prob_dos= ceil_to_one(prob_dos+(bool_to_int(entities["chk_dos_mainntw"] && entities["chk_dos_fire"]) * prob_fire));
	
	var prob_unresponsive=ceil_to_one(prob_inacc+prob_malware+prob_dos);
	var prob_delay=ceil_to_one(prob_malware+prob_dos);
	
	var prob_main=ceil_to_one(prob_unresponsive+prob_delay);
	prob_backup= ceil_to_one(prob_backup + (bool_to_int(entities["chk_backup_ntw"]) * prob_main));
	
	var prob_tot=ceil_to_one(prob_main*prob_backup);
	
	
	
	var res="<div class='result'><table><tr><th>Total Probability of Failure</th> <th>=</th><th>"+ prob_tot +"</th></tr>";
	res+="<tr><td>&nbsp;</td></tr><tr><td>Probability of Main System Failure </td><td>=</td><td>"+ prob_main +"</td></tr>";
	res+="<tr><td>Probability of Backup System Failure</td><td>=</td><td>"+ prob_backup +"</td></tr>";
	res+="<tr><td>Probability of Unresponsive System</td><td>=</td><td>"+ prob_unresponsive +"</td></tr>";
	res+="<tr><td>Probability of Delayed Responses from System </td><td>=</td><td>"+ prob_delay +"</td></tr>";
	res+="<tr><td>Probability of Inaccurate Calculations</td><td>=</td><td>"+ prob_inacc +"</td></tr>";
	res+="<tr><td>Probability of Inaccurate Calculations of Runway Length</td><td>=</td><td>"+ prob_run +"</td></tr>";
	res+="<tr><td>Probability of Inaccurate Calculations  of Environment Data</td><td>=</td><td>"+ prob_env +"</td></tr>";
	res+="<tr><td>Probability of Inaccurate Calculations  of Airplane Data</td><td>=</td><td>"+ prob_air +"</td></tr>";
	res+="<tr><td>Probability of Inaccurate Calculations  of Sensor Data</td><td>=</td><td>"+ prob_sensor +"</td></tr>";
	res+="<tr><td>Probability of Malware in System</td><td>=</td><td>"+ prob_malware +"</td></tr>";
	res+="<tr><td>Probability of Denial of Service attack in System</td><td>=</td><td>"+ prob_dos +"</td></tr>";
	res+="<tr><td>Probability of Storage Issue with Airplane Data</td><td>=</td><td>"+ (bool_to_int(entities["chk_airdata_store"]) * prob_store) +"</td></tr>";
	res+="<tr><td>Probability of Storage Issue with Sensor Data</td><td>=</td><td>"+ (bool_to_int(entities["chk_sensordata_store"]) * prob_store) +"</td></tr>";
	res+="<tr><td>Probability of Firewall Issue with Remote Data Storage of Airplane Data</td><td>=</td><td>"+ (bool_to_int(entities["chk_airdata_store"] && entities["chk_store_fire"]) * prob_store) +"</td></tr>";
	res+="<tr><td>Probability of Firewall Issue with Remote Data Storage of Sensor Data</td><td>=</td><td>"+ (bool_to_int(entities["chk_sensordata_store"] && entities["chk_store_fire"]) * prob_store) +"</td></tr>";
	res+="<tr><td>Probability of Firewall Issue with System Network</td><td>=</td><td>"+ (bool_to_int(entities["chk_fire_mainntw"]) * prob_fire) +"</td></tr>";
	res+="</table></div>"
	document.getElementById("res").innerHTML=res;
 }