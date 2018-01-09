//////////////////////////////////////////////////
// VARIABILI
//////////////////////////////////////////////////
var API_PATH = "http://www.arcadistribution.com/tco/api/app/";
var NUMERO_RIGHE_ORDINE = 20;


//////////////////////////////////////////////////
// LOGIN e LOGOUT
//////////////////////////////////////////////////

//funzione di login
$( "#login_form_submit" ).bind( "click", function(event, ui) {
  
  //resetto il msg response
  $('.response_msg').html("<span class=\"ajax_loader_msg\" >login in corso</span>");
  
  //recupero username e password
  var username = document.getElementById('username').value;
  var password = MD5(document.getElementById('password').value);
  
  //effettuo la chiamata ajax ad arcadistribution.com
  $.ajax({
    url: API_PATH + 'login.php',
    type: "POST",   
    crossDomain: true,
    data: {
      username: username,
      password: password
    },
    success: function(response){
      
      try{
        
        //verifico se il login � stato effettuato correttamente
        if(isJSON(response)){

          //verifico se ho gi� effettuato il caricamento dei dati nella giornata odierna
          var login = JSON.parse(response);
          var agente = JSON.parse(localStorage.getItem('agente'));

          var import_data = true;         
          if(agente !== null){

            //verifico l'ultima data di login
            if(agente.ultimo_login.substring(0, 10) === login.ultimo_login.substring(0, 10)){
              import_data = false;             
            }
            
          }
          
          //effettuo il salvataggio dei dati json dell'agente nel local storage
          localStorage.setItem('agente', response);
          
          //mostro il messaggio di login
          $('.response_msg').html("<span class='clr-green' >Login effettuato correttamente</span>");
          
          //reindirizzo all'homepage
          setTimeout(function(){
            
            //verifico se rimandare alla home o alla pagina di importazione
            if(import_data === true){
              location.href="import.html";
            }else{
              location.href="home.html";
            }
            
          }, 2000);
          
        }else{
          $('.response_msg').html("<span class='clr-red' >" + response + "</span>");
        }
        
      }catch(err){
        $('.response_msg').html("<span class='clr-red' >" + err + "</span>");
      }  
  
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      
      //verifico se l'utente si era gi� loggato ed eventualmente verifico i dati con l'ultimo login effettuato
      if(localStorage.getItem('agente') !== null){
        
        var agente = JSON.parse(localStorage.getItem('agente'));
        
        if(agente.email === username && agente.password === password){

          //mostro il messaggio di login
          $('.response_msg').html("<span class='clr-green' >Login effettuato correttamente</span>");
          
          //reindirizzo all'homepage
          setTimeout(function(){
            location.href="home.html";
          }, 2000);
        
        }
      
      }else{
        $('.response_msg').html("<span class='clr-red' >Impossibile procedere. Per effettuare il primo login &egrave; necessaria una connessione internet.</span>");
      }      
      
    }

  });
  
});


//funzione logout
function logout(){
  
  //effettuo il redirect
  location.href="index.html";
  
}



//////////////////////////////////////////////////
// HOME
//////////////////////////////////////////////////
$("#homePage").on("pagecreate", function( event ){
  
  //recupero le info dell'agente
  var agente = JSON.parse(localStorage.getItem('agente'));
  
  $('#nome_agente').html(agente.nome + " " + agente.cognome);
  
});



//////////////////////////////////////////////////
// IMPORT
//////////////////////////////////////////////////

//funzione di importazione - STEP1 import clienti
$( "#import_form_submit" ).bind( "click", function(){
  
  //resetto il msg response
  $.mobile.loading( "show", {
    text: "importazione in corso, attendere",
    textVisible: true,
    theme: "",
    html: ""
  });
  
  //resetto il messaggio iniziale alla lista di importazione
  $('.response_msg').html("");
  
  //recupero i dati dell'agente
  var agente = JSON.parse(localStorage.getItem('agente'));
  
  //se non ho dati per l'agente effettuo il logout
  if (agente === null){
    logout();
  }
  
  var codice_agente = agente.codice;
  var token = agente.token;
  
  console.log('IMPORTAZIONE CLIENTI >> codice:' + codice_agente + ' - token:' + token);

  //recupero via ajax i clienti 
  $.ajax({
    url: API_PATH + 'clienti.php',
    type: "POST",   
    crossDomain: true,
    data: {
      codice_agente: codice_agente,
      token: token
    },
    success: function(response){
      
      try{
        
        //effettuo il salvataggio dei dati json dell'agente nel local storage
        localStorage.setItem('clienti', response);
        
        //mostro il messaggio di importazione
        $('.response_msg').append("<li><img src=\"img/button_confirm.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>ANAGRAFICA CLIENTI IMPORTATA</h2></li>");
        
        //lancio lo step successivo di importazione
        importArticoli(codice_agente, token);

      }catch(err){
        $('.response_msg').append("<li><img src=\"img/button_close.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>ANAGRAFICA CLIENTI ERRORE</h2></li>");
        $.mobile.loading( "hide" );
      }  

    },
    error: function (xhr, status) {
      console.log("Error " + status + ": "+ xhr);
      $.mobile.loading( "hide" );
    }
  });  
  
});

//STEP2 import articoli
function importArticoli(codice_agente, token){
  
  console.log('IMPORTAZIONE ARTICOLI >> codice:' + codice_agente + ' - token:' + token);
  
  $.ajax({
    url: API_PATH + 'articoli.php',
    type: "POST",   
    crossDomain: true,
    data: {
      codice_agente: codice_agente,
      token: token
    },
    success: function(response){
      
      try{
        
        //effettuo il salvataggio dei dati json dell'agente nel local storage
        localStorage.setItem('articoli', response);
        
        //mostro il messaggio di importazione
        $('.response_msg').append("<li><img src=\"img/button_confirm.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>ANAGRAFICA ARTICOLI IMPORTATA</h2></li>");

        //lancio lo step successivo di importazione
        importModalitaPagamento(codice_agente, token);

      }catch(err){
        $('.response_msg').append("<li><img src=\"img/button_close.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>ANAGRAFICA ARTICOLI ERRORE</h2></li>");
        $.mobile.loading( "hide" );
      }  

    },
    error: function (xhr, status) {
      console.log("Error " + status + ": "+ xhr);
      $.mobile.loading( "hide" );
    }
  });
  
}

//STEP3 import modalita pagamento
function importModalitaPagamento(codice_agente, token){
  
  console.log('IMPORTAZIONE MODALITA PAGAMENTO >> codice:' + codice_agente + ' - token:' + token);
  
  $.ajax({
    url: API_PATH + 'modalita_pagamento.php',
    type: "POST",   
    crossDomain: true,
    data: {
      codice_agente: codice_agente,
      token: token
    },
    success: function(response){
      
      try{
        
        //effettuo il salvataggio dei dati json dell'agente nel local storage
        localStorage.setItem('pagamento', response);
        
        //mostro il messaggio di importazione
        $('.response_msg').append("<li><img src=\"img/button_confirm.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>MODALIT&Agrave; DI PAGAMENTO IMPORTATE</h2></li>");

        //recupero via ajax gli articoli
        $.mobile.loading( "hide" );

      }catch(err){
        $('.response_msg').append("<li><img src=\"img/button_close.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>MODALIT&Agrave; DI PAGAMENTO ERRORE</h2></li>");
        $.mobile.loading( "hide" );
      }  

    },
    error: function (xhr, status) {
      console.log("Error " + status + ": "+ xhr);
      $.mobile.loading( "hide" );
    }
  });
  
}



//////////////////////////////////////////////////
// ORDINI STEP1 - RICERCA CLIENTE
//////////////////////////////////////////////////
$( document ).on( "pageinit", "#ordiniCreazioneStep1Page", function() {
  
  $( "#search_customer" ).on( "filterablebeforefilter", function ( e, data ) {
    var $ul = $( this ),
        $input = $( data.input ),
        value = $input.val(),
        html = "";
        $ul.html( "" );
        
    //effettuo la ricerca dopo aver inserito almeno 3 caratteri
    if ( value && value.length >= 3 ){
      
      $ul.html( "<li><div class='ui-loader'><span class='ui-icon ui-icon-loading'></span></div></li>" );
      $ul.listview( "refresh" );
      
      //recupero le info dell'agente
      var clienti = JSON.parse(localStorage.getItem('clienti'));

      //ciclo l'elenco dei clienti
      html = "";
      $.each( clienti, function( id_tco, cliente ){
        html += "<li>";
          html += "<a href=\"javascript:void(0);\" onClick=\"creaOrdine_AggiungiCliente('"+ cliente.codice_cliente +"','"+ cliente.ragione_sociale +"','"+ cliente.codice_pagamento +"');\" >";
            html += cliente.ragione_sociale + " - " + cliente.codice_cliente;
          html += "</a>";
        html += "</li>";
      });

      $ul.html( html );
      $ul.listview( "refresh" );
      $ul.trigger( "updatelayout");

    }
    
  });
  
});

//creo l'ordine, aggiungo i dati del cliente e rimando allo step 2
function creaOrdine_AggiungiCliente(codice_cliente, ragione_sociale, codice_pagamento){
  
  //tengo in memoria un solo ordine, cancello eventuali ordini precedenti
  if(localStorage.getItem('ordine') !== null){
    localStorage.removeItem('ordine');
  }
  
  //recupero le info dell'agente
  var agente = JSON.parse(localStorage.getItem('agente'));
  
  //creo l'array e lo converto in json
  var ordine = { 'agente_codice': agente.codice,
                'agente_nome': agente.nome + " " + agente.cognome,
                'cliente_codice': codice_cliente,
                'cliente_ragionesociale': ragione_sociale,
                'cliente_codicepagamento': codice_pagamento
              };
  var ordine_json = JSON.stringify(ordine);
  
  //salvo il json nel local storage
  localStorage.setItem('ordine', ordine_json);
  
  //reindirizzo allo step2
  location.href="ordini_creazione_step2.html";
  
}



//////////////////////////////////////////////////
// ORDINI STEP2 - RIGHE ORDINE
//////////////////////////////////////////////////
$( document ).on("pagecreate", "#ordiniCreazioneStep2Page", function() {
  
  //funzione per creare le righe nella tabella
  for (i = 0; i < NUMERO_RIGHE_ORDINE; i++) { 
    creaRigheOrdine(i);
  }    
  //definisco la dimensione delle colonne
  $('table#righe-ordine tr td').eq(0).css('width','1%');
  $('table#righe-ordine tr td').eq(1).css('width','2%');
  $('table#righe-ordine tr td').eq(2).css('width','10%');
  $('table#righe-ordine tr td').eq(3).css('width','36%');
  $('table#righe-ordine tr td').eq(4).css('width','10%');
  $('table#righe-ordine tr td').eq(5).css('width','10%');
  $('table#righe-ordine tr td').eq(6).css('width','3%');
  $('table#righe-ordine tr td').eq(7).css('width','12%');
  $('table#righe-ordine tr td').eq(8).css('width','15%');
  
});

function creaRigheOrdine(id_riga) {
  
  var numero_riga=id_riga+1;
  
  var riga = "<tr>" +
                "<td>" +
                  "<span class=\"numero_riga\" >" + numero_riga + ".</span>" +
                "</td>" +
                "<td>" +
                  "<a id=\"ricerca_riga_" + id_riga + "\" href=\"javascript:void(0);\" onClick=\"ricercaArticolo(" + id_riga + ");\" >" +
                    "<i class=\"zmdi zmdi-search-for zmdi-hc-2x\" ></i>" +
                  "</a>" +                  
                  "<a id=\"reset_riga_" + id_riga + "\" href=\"javascript:void(0);\" onClick=\"resetRigaArticolo(" + id_riga + ");\" style=\"display:none;\" >" +
                    "<i class=\"zmdi zmdi-close-circle-o zmdi-hc-2x\" ></i>" +
                  "</a>" +
                "</td>" + 
                "<td>" +
                  //campo input
                  "<input type=\"text\" id=\"codice_" + id_riga + "\" class=\"ricerca_articolo\" value=\"\" data-clear-btn=\"false\" >" +
                  //campo visualizzazione
                  "<span id=\"view_codice_" + id_riga + "\" ></span>" +
                "</td>" +
                "<td>" +
                  //campi input
                  "<input type=\"text\" id=\"descrizione_" + id_riga + "\" class=\"ricerca_articolo\" value=\"\" data-clear-btn=\"false\" >" +
                  "<input type=\"hidden\" id=\"taglia_" + id_riga + "\" value=\"\" data-clear-btn=\"false\" >" +
                  "<input type=\"hidden\" id=\"colore_" + id_riga + "\" value=\"\" data-clear-btn=\"false\" >" +
                  //campi visualizzazione
                  "<span id=\"view_descrizione_" + id_riga + "\" class=\"descrizione_articolo\" ></span>" +
                  "<span id=\"view_taglia_" + id_riga + "\" ></span>" +
                  "<span id=\"view_colore_" + id_riga + "\" ></span>" +
                "</td>" +
                "<td>" +
                  "<input type=\"text\" name=\"prezzo\" id=\"prezzo_" + id_riga + "\" value=\"\" style=\"text-align:right\" READONLY >" +
                "</td>" +
                "<td>" +
                  "<input type=\"text\" name=\"qta\" id=\"qta_" + id_riga + "\" value=\"\" style=\"text-align:right\" onChange=\"ricalcolaTotali(" + id_riga + ");\" >" +
                "</td>" +
                "<td class=\"campo_omaggio\">" +
                  "<input type=\"checkbox\" id=\"omaggio_" + id_riga + "\" value=\"1\"  onChange=\"ricalcolaTotali(" + id_riga + ");\" >" +
                "</td>" +
                "<td class=\"campo_sconto\">" +
                  "<input type=\"text\" id=\"sconto_" + id_riga + "\" value=\"\" style=\"text-align:right\"  onChange=\"ricalcolaTotali(" + id_riga + ");\" >" +
                "</td>" +
                "<td>" +
                  "<input type=\"text\" name=\"totale\" id=\"totale_" + id_riga + "\" value=\"\" style=\"text-align:right\" READONLY >" +
                "</td>" +
              "</tr>";
  
  $('#righe-ordine tbody').append(riga);

}

//funzione per effettuare la ricerca dell'articolo
function ricercaArticolo(id_riga){
  
  //recupero codice e descrizione inseriti
  var codice_ricerca = document.getElementById('codice_' + id_riga).value;
  var descrizione_ricerca = document.getElementById('descrizione_' + id_riga).value;
  
  //effettuo la ricerca per codice e descrizione
  var articoli = JSON.parse(localStorage.getItem('articoli'));

  //ciclo l'elenco dei articoli
  var numero_risultati_ricerca = 0;
  var risultati_ricerca = [];
  $.each( articoli, function( codice_articolo, articolo ){
    var descrizione_articolo = articolo.descrizione;
    
    //aggiungo un carattere fittizio davanti a codice articolo e descrizione
    codice_articolo_confronto = "#" + codice_articolo;
    descrizione_articolo_confronto = "#" + descrizione_articolo;
    
    //se � stato inserito il codice articolo effettuo la ricerca solo per codice (dall'inizio della stringa)
    if(codice_ricerca !== "" && codice_articolo_confronto.toLowerCase().indexOf( codice_ricerca.toLowerCase() ) === 1){
      
      risultati_ricerca.push(codice_articolo + "|" + descrizione_articolo);
      numero_risultati_ricerca++;
    
    }//altrimenti effettuo la ricerca per descrizione (all'interno della stringa)
    else if(codice_ricerca === "" && descrizione_ricerca !== "" && descrizione_articolo_confronto.toLowerCase().indexOf( descrizione_ricerca.toLowerCase() ) > 0){
      
      risultati_ricerca.push(codice_articolo + "|" + descrizione_articolo);
      numero_risultati_ricerca++;
      
    }
    
  });

  //se non ho trovato nessuna corrispondenza
  if(numero_risultati_ricerca === 0){
    $("#popupSegnalazioneContent").html('Nessun articolo trovato per i parametri di ricerca inseriti.');
    $("#popupSegnalazione").popup("open", "pop");
  }
  //altrimenti se ho un solo risultato predispongo i campi nel form
  else if(numero_risultati_ricerca === 1){
    
    $.each( risultati_ricerca, function( id, articolo ){
      var dati_articolo = articolo.split("|");
      inserisciRigaArticolo(id_riga, dati_articolo[0], '');
    });
    
  }
  //altrimenti apro il popup di selezione
  else{
    
    var list = "<ul id=\"search_item\" data-role=\"listview\" >";
    
    $.each( risultati_ricerca, function( id, articolo ){
      var dati_articolo = articolo.split("|");
      list += "<li>";
        list += "<a href=\"javascript:void(0);\" onClick=\"inserisciRigaArticolo(" + id_riga + ", '" + dati_articolo[0] + "', 'popup');\" >";
          list += dati_articolo[0] + " - " + dati_articolo[1];
        list += "</a>";
      list += "</li>";
    });
    
    list += "</ul>";

    $("#search_list").html(list);
    
    //apro il popup
    $("#popupRicercaArticolo").popup("open", "pop");
    
  }
  
}

//funzione per inserire l'articolo selezionato nella riga e predispore gli ulteriori campi
function inserisciRigaArticolo(id_riga, codice_articolo_selezionato, tipo){
  
  //chiudo il popup di ricerca articoli
  if(tipo === 'popup'){
    $("#popupRicercaArticolo").popup("close", "pop");
  }
  
  //recupero tutte le info per l'articolo ed imposto la riga
  var descrizione="";
  var confezione="";
  var numero_max="";
  var taglie="";
  var colori="";
  var disponibile="";
  var disponibile_da="";
  var prezzo_listino="";
  var prezzo_scontato="";
  
  
  var articoli = JSON.parse(localStorage.getItem('articoli'));
  $.each( articoli, function( codice_articolo, articolo ){
    
    if(codice_articolo === codice_articolo_selezionato){
      
      //recupero le variabili dell'articolo
      codice_articolo=articolo.codice;
      descrizione=articolo.descrizione;
      confezione=articolo.confezione;
      numero_max=articolo.numero_max;
      taglie=articolo.taglie;
      colori=articolo.colori;
      disponibile=articolo.disponibile;
      disponibile_da=articolo.disponibile_da;
      prezzo_listino=articolo.prezzo_listino;
      prezzo_scontato=articolo.prezzo_scontato;
      
      //esco dal ciclo
      return false;
      
      
    }

  });
  

  //se l'articolo non � disponibile mostro il popup di segnalazione

  
  //se l'articolo � a taglia / colore mostro il popup di selezione
  var selezione_taglia_colore = "";
  if(taglie !== "" || colori !== ""){
    
    //resetto l'attuale select, recupero le taglie ed imposto il campo del form
    if(taglie !== ""){
      
      $('#taglia').empty();
      $('#taglia').append('<option value=""></option>');
      selezione_taglia_colore += "T";
      
      var elenco_taglie = taglie.split(";");
      $.each( elenco_taglie, function( id, taglia ){
        if(taglia !== ""){
          var dati_taglia = taglia.split(",");
          $('#taglia').append($('<option>', { 
            value: dati_taglia[0] + '|' + dati_taglia[1],
            text : dati_taglia[1] 
          }));
        }
      });
      
      $('#taglia').show();//mostro la select
      $("#taglia").val('');//imposto la selezione di default
    }else{
      $('#taglia').hide();
    }
    
    //recupero i colori ed imposto il campo del form
    if(colori !== ""){
                 
      $('#colore').empty();
      $('#colore').append('<option value=""></option>');
      selezione_taglia_colore += "C";
      
      var elenco_colori = colori.split(";");
      $.each( elenco_colori, function( id, colore ){
        if(colore !== ""){
          var dati_colore = colore.split(",");
          $('#colore').append($('<option>', { 
            value: dati_colore[0] + '|' + dati_colore[1],
            text : dati_colore[1] 
          }));
        }
      });
      
      $('#colore').show();
      $("#colore").val('');//imposto la selezione di default
    }else{
      $('#colore').hide();
    }
    
    //salvo nel campo nascosto del popup l'id della riga di riferimento ed il tipo di selezione T, C o TC
    $('#id_riga_caratteristiche').val(id_riga);
    $('#tipo_selezione_caratteristiche').val(selezione_taglia_colore);
    
    //apertura del popup
    if(tipo === 'popup'){
      
      $( '#popupRicercaArticolo' ).on({
        popupafterclose: function() {
          setTimeout( function(){ $( '#popupSelezioneTaglieColori' ).popup("open", "pop"); }, 100 );
        }
      });
    
    }else{
      $("#popupSelezioneTaglieColori").popup("open", "pop");
    }
    
  }
   
  //compilo i campi della riga
  $('#codice_' + id_riga).val(codice_articolo_selezionato);
  $('#descrizione_' + id_riga).val(descrizione);
  $('#taglia_' + id_riga).val('');
  $('#colore_' + id_riga).val('');
  
  //riformatto il prezzo
  prezzo = number_format(prezzo_listino, 2, '.', '');
  $('#prezzo_' + id_riga).val(prezzo);
  
  //imposto i campi descrittivi (codice e descrizione) e nascondo i campi codice
  $('#codice_' + id_riga).hide();
  $('#descrizione_' + id_riga).hide();
  $('#view_codice_' + id_riga).html(codice_articolo_selezionato);
  $('#view_descrizione_' + id_riga).html(descrizione);
  
  //modifico l'icona a inizio riga per consentire il reset della stessa
  $('#ricerca_riga_' + id_riga).hide();
  $('#reset_riga_' + id_riga).show();
  
}

//funzione per resettare la riga articolo creata
function resetRigaArticolo(id_riga){
  
  //svuoto tutti i campi
  $('#codice_' + id_riga).val('');
  $('#descrizione_' + id_riga).val('');
  $('#taglia_' + id_riga).val('');
  $('#colore_' + id_riga).val('');
  $('#prezzo_' + id_riga).val('');
  $('#view_codice_' + id_riga).html('');
  $('#view_descrizione_' + id_riga).html('');
  $('#view_taglia_' + id_riga).html('');
  $('#view_colore_' + id_riga).html('');
  
  //reimposto la corretta visualizzazione di campi e icone
  $('#codice_' + id_riga).show();
  $('#descrizione_' + id_riga).show();
  $('#ricerca_riga_' + id_riga).show();
  $('#reset_riga_' + id_riga).hide();  
  
}

//funzione per impostare le caratteristiche selezionate di taglia e colore nella riga articolo
function impostaCaratteristicheArticolo(){
  
  //recupero l'id della riga e le caratteristiche impostate
  var id_riga=$('#id_riga_caratteristiche').val();
  var tipo=$('#tipo_selezione_caratteristiche').val();
  
  //verifico le caratteristiche articolo da recuperare
  var caratteristica1 = "";
  var caratteristica2 = "";
  var lunghezza_stringa = (tipo.trim().length)*1;
  
  caratteristica1 = tipo.substring(0,1);
  if(lunghezza_stringa > 1) caratteristica2 = tipo.substring(1,2);

  //recupero la taglia
  if(caratteristica1 === 'T' || caratteristica2 === 'T'){
    var taglia_selezionata=$('#taglia').val();
    var dati_taglia=taglia_selezionata.split("|");
    
    $('#taglia_' + id_riga).val(dati_taglia[0]);
    $('#view_taglia_' + id_riga).html(' - <b>' + dati_taglia[1] + '</b>');
  }

  //recupero il colore
  if(caratteristica1 === 'C' || caratteristica2 === 'C'){
    var colore_selezionato=$('#colore').val();
    var dati_colore=colore_selezionato.split("|");
    
    $('#colore_' + id_riga).val(dati_colore[0]);
    $('#view_colore_' + id_riga).html(' - <b>' + dati_colore[1] + '</b>');
  }
  
  //chiudo il popup
  $("#popupSelezioneTaglieColori").popup("close", "pop");
  
}

//funzione per ricalcolare i totali di riga e di ordine
function ricalcolaTotali(id_riga){
  
  //recupero i dati necessari per il ricalcolo dei totali
  var prezzo = $('#prezzo_' + id_riga).val()*1;
  var qta = $('#qta_' + id_riga).val()*1;
  var sconto = $('#sconto_' + id_riga).val()*1;
  
  var omaggio = 0;
  if(document.getElementById('omaggio_' + id_riga).checked === true) omaggio = 1;
  
  //ricalcolo i totali
  var totale_riga = 0;
  var totale_ordine = 0;
  if(omaggio === 1){
    totale_riga = 0;
    $('#sconto_' + id_riga).val("");
  }else{
    totale_riga = (prezzo * qta) - ((prezzo * qta) / 100 * sconto);
  }
  
  //riformatto i totali
  totale_riga = number_format(totale_riga, 2, '.', '');
  
  $('#totale_' + id_riga).val(totale_riga);
  
}

//funzione per aggiungere le righe impostate all'ordine
function creaOrdine_AggiungiRighe(){
  
  //ciclo le righe per trovare la prima senza codice articolo
  var righe = {};
  var righe_counter = 0;
  for (i = 0; i < NUMERO_RIGHE_ORDINE; i++) { 
    
    if( $('#codice_' + i).val() !== ""){
      
      righe_counter++;
      
      var riga = {};
      riga.codice = $('#codice_' + i).val();
      riga.descrizione = $('#descrizione_' + i).val();
      riga.taglia = $('#taglia_' + i).val();
      riga.colore = $('#colore_' + i).val();
      riga.prezzo = $('#prezzo_' + i).val();
      riga.qta = $('#qta_' + i).val();
      
      riga.omaggio = 0;
      riga.sconto = ($('#sconto_' + i).val());       
      if(document.getElementById('omaggio_' + i).checked === true){
        riga.omaggio = 1;
        riga.sconto = 100;
      }
      
      riga.totale = $('#totale_' + i).val();
      
      righe[righe_counter] = riga;

    }
    
  }
  
  //aggiungo il numero di righe inserite
  righe.numero_righe = righe_counter;

  //recupero i dati dell'ordine salvati
  var ordine = JSON.parse(localStorage.getItem('ordine'));  
  
  //aggiungo i dati relativi alle righe ordine e lo risalvo
  ordine.righe = righe;
  
  //salvo in console le righe
  console.log(ordine);
  
  //risalvo l'ordine in locale
  var ordine_json = JSON.stringify(ordine);
  localStorage.setItem('ordine', ordine_json);
  
  //reindirizzo allo step3
  location.href="ordini_creazione_step3.html";

}

//funzione per ricalcolare il totale riga
function ricalcolaTotaleRiga(id_riga){
  alert(id_riga);
  var prezzo = ($('#prezzo_' + i).val())*1;
  var qta = ($('#qta_' + i).val())*1;
  var sconto = ($('#sconto_' + i).val())*1;
  
  var totale_riga = 0;
  totale_riga = (prezzo * qta) - ((prezzo * qta)/100)*sconto;

}



//////////////////////////////////////////////////
// ORDINI STEP3 - COMPLETAMENTO ORDINE
//////////////////////////////////////////////////
$( document ).on( "pageinit", "#ordiniCreazioneStep3Page", function() {
  
  //recupero i dati del cliente selezionato nell'ordine
  var ordine = JSON.parse(localStorage.getItem('ordine'));
  var cliente_ordine = ordine.cliente_codice;
  var clienti = JSON.parse(localStorage.getItem('clienti'));
  
  var ragione_sociale = "";
  var indirizzo = "";
  var cap = "";
  var provincia = "";
  var modalita_pagamento_cliente = "";
  $.each( clienti, function( id, dati_cliente ){
    if(dati_cliente.codice_cliente === cliente_ordine){
      ragione_sociale = dati_cliente.ragione_sociale;
      indirizzo = dati_cliente.indirizzo;
      citta = dati_cliente.citta;
      cap = dati_cliente.cap;
      provincia = dati_cliente.provincia;
      modalita_pagamento_cliente = dati_cliente.codice_pagamento;
      
      return false;
    }
  });
  
  
   
  //imposto le opzioni di selezione della modalit� di pagamento
  var modalita_pagamento = JSON.parse(localStorage.getItem('pagamento'));
  $.each( modalita_pagamento, function( codice, descrizione ){
    if(codice !== ""){
      $('#modalita_pagamento').append($('<option>', { 
        value: codice,
        text : codice + ' - ' + descrizione
      }));
    }
  });
  //imposto la modalit� di default per il cliente
  $('#modalita_pagamento').val(modalita_pagamento_cliente).change();

  
  
  //imposto le date di consegna richieste
  //se entro le 15.00 allora imposto il giorno successivo
  //se oltre le 15.00 allora due giorni successivi
  var oggi = new Date();
  var data_consegna = new Date();
  var ora = oggi.getHours();

  data_consegna.setDate(oggi.getDate() + 1);
  if(ora>=15){
    data_consegna.setDate(oggi.getDate() + 2);
  }

  //recupero giorno, mese e anno della data consegna
  gg = pad(data_consegna.getDate(), 2);
  mm = pad(data_consegna.getMonth()+1, 2);//gennaio = 0
  aaaa = data_consegna.getFullYear();
  
  $('#data_consegna').val(aaaa + '-' + mm + '-' + gg);
  
  
  
  //visualizzo l'indirizzo di fatturazione
  var indirizzo_fatturazione = "";
  indirizzo_fatturazione+= ragione_sociale +"<br/>";
  indirizzo_fatturazione+= indirizzo +"<br/>";
  indirizzo_fatturazione+= cap + " " + citta + " (" + provincia + ")"; 
  $('#indirizzo_fatturazione').html(indirizzo_fatturazione);
  
});
