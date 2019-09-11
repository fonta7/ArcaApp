//////////////////////////////////////////////////
// SITUAZIONE CREDITI
//////////////////////////////////////////////////
$("#situazioneCreditiPage").on("pagecreate", function( event ){
  
  //tolgo il sottotitolo
  $("#titolo").html( "Situazione Crediti" );

  //nascondo i contenuti degli altri step
  $('.arrow-back').hide();
  $('.step2').hide();

  //popolo il filtro per cliente (anche se nascosto)
  var situazione_crediti = JSON.parse(localStorage.getItem('situazione_crediti'));
  var filtro_clienti = situazione_crediti.filtro_altro_cliente;

  $('#filtro_cliente').empty();
  $('#filtro_cliente').append('<option value=""></option>');
  $.each( filtro_clienti, function( codice, ragione_sociale ){
    $('#filtro_cliente').append($('<option>', { 
      value: codice,
      text : ragione_sociale 
    }));
  });

});


//aggiornamento visualizzazione con filtro
function filterView(){

  //verifico quale view richiamare
  if($('#current_view').val() == 'scadenzario_altro_cliente')
    viewScadenzarioAltroCliente();
  else if($('#current_view').val() == 'scadenzario_altro_data')
    viewScadenzarioAltroData();

}


//visualizzazione SCADENZARIO RIBA PER DATA
function viewScadenzarioRibaData(){

  //imposto il sottotitolo
  $("#titolo").html( "Scadenzario RiBa per Data" );
  $("#current_view").val("scadenzario_riba_data");

  //nascondo i contenuti degli altri step
  $('.step1').hide();
  $('.arrow-back').fadeIn(800);
  $('.filtro-ricerca').hide();
  $('.step2').fadeIn(800);

  //recupero i dati da mostrare
  var situazione_crediti = JSON.parse(localStorage.getItem('situazione_crediti'));
  var scadenze_riba = situazione_crediti.scadenzario_riba_per_data;

  //ciclo le scadenze
  $.each( scadenze_riba, function( codice, scadenze_riba_data ){

    var totale_raggruppamento = 0;
    $.each( scadenze_riba_data, function( codice, scadenza ){
      
      var riga = "<tr>" +
                    "<td>" + scadenza.ragione_sociale_cliente + "</td>" + 
                    "<td align=center >" + scadenza.data_scadenza + "</td>" + 
                    "<td align=center >" + scadenza.modalita_incasso + "</td>" + 
                    "<td align=right >" + number_format(scadenza.importo_effetto,2,',','.') + "</td>" + 
                    "<td align=center >" + scadenza.numero_documento + "<br/>" + scadenza.data_documento + "</td>" + 
                "</tr>";

      //mostro la riga
      $('#righe tbody').append(riga);

      totale_data_scadenza = scadenza.data_scadenza;
      totale_raggruppamento+= (scadenza.importo_effetto)*1;

    });

    //totale per gruppo
    var totale = "<tr class=\"totale\" >" +
                  "<td colspan=3 > TOTALE AL " + totale_data_scadenza + "</td>" + 
                  "<td align=right >" + number_format(totale_raggruppamento,2,',','.') + "</td>" + 
                  "<td></td>" +  
              "</tr>" +
              "<tr><td colspan=5 ></td></tr>";
    //mostro il totale
    $('#righe tbody').append(totale);

  });

}


//visualizzazione SCADUTO R.D., BONIFICI ED INSOLUTI PER CLIENTE
function viewScadenzarioAltroCliente(){

  //imposto il sottotitolo
  $("#titolo").html( "Scadenzario Rimesse Dirette, Bonifici ed Insoluti per Cliente" );
  $("#current_view").val("scadenzario_altro_cliente");

  //nascondo i contenuti degli altri step
  $('.step1').hide();
  $('.arrow-back').fadeIn(800);
  $('.filtro-ricerca').show();
  $('.step2').fadeIn(800);

  //verifico se e impostato un filtro
  var filtro_cliente = $('#filtro_cliente').val();
  var filtro_da_data = $('#filtro_da_data').val();
  if(filtro_da_data != '') filtro_da_data = filtro_da_data.replace(/-/g, "");
  //console.log(filtro_cliente + ' - ' + filtro_da_data);

  //recupero i dati da mostrare
  var situazione_crediti = JSON.parse(localStorage.getItem('situazione_crediti'));
  var scadenze_altro = situazione_crediti.scadenzario_altro_per_cliente;

  //svuoto la tabella
  $("#righe > tbody").html("");

  //riordino per data scadenza
  $.each( scadenze_altro, function( codice, scadenze_altro_cliente ){

    var totale_raggruppamento = 0;
    $.each( scadenze_altro_cliente, function( codice, scadenza ){

      //recupero codice_cliente e data_scadenza
      var codice_cliente = scadenza.codice_cliente;
      var data_scadenza = date_format(scadenza.data_scadenza, 'dd/mm/yyyy', 'yyyymmdd');

      if(
				((filtro_cliente != "" && filtro_cliente == codice_cliente) || filtro_cliente == '') 
				&& 
				((filtro_da_data != "" && filtro_da_data <= data_scadenza) || filtro_da_data == '')
			){

        var riga = "<tr>" +
                      "<td>" + scadenza.ragione_sociale_cliente + "</td>" + 
                      "<td align=center >" + scadenza.data_scadenza + "</td>" + 
                      "<td align=center >" + scadenza.modalita_incasso + "</td>" + 
                      "<td align=right >" + number_format(scadenza.importo_effetto,2,',','.') + "</td>" + 
                      "<td align=center >" + scadenza.numero_documento + "<br/>" + scadenza.data_documento + "</td>" + 
                  "</tr>";

              //mostro la riga
              $('#righe tbody').append(riga);

              totale_cliente = scadenza.ragione_sociale_cliente;
              totale_raggruppamento+= (scadenza.importo_effetto)*1;

      }
      
    });

    if(totale_raggruppamento != 0){

      //totale per gruppo
      var totale = "<tr class=\"totale\" >" +
                    "<td colspan=3 > TOTALE PER " + totale_cliente + "</td>" + 
                    "<td align=right >" + number_format(totale_raggruppamento,2,',','.') + "</td>" + 
                    "<td></td>" +  
                "</tr>" +
                "<tr><td colspan=5 ></td></tr>";
      //mostro il totale
      $('#righe tbody').append(totale);

    }

  });

}


//visualizzazione SCADUTO R.D., BONIFICI ED INSOLUTI PER DATA
function viewScadenzarioAltroData(){

  //imposto il sottotitolo
  $("#titolo").html( "Scadenzario Rimesse Dirette, Bonifici ed Insoluti per Data" );
  $("#current_view").val("scadenzario_altro_data");

  //nascondo i contenuti degli altri step
  $('.step1').hide();
  $('.arrow-back').fadeIn(800);
  $('.filtro-ricerca').show();
  $('.step2').fadeIn(800);

  //verifico se e impostato un filtro
  var filtro_cliente = $('#filtro_cliente').val();
  var filtro_da_data = $('#filtro_da_data').val();
  if(filtro_da_data != '') filtro_da_data = filtro_da_data.replace(/-/g, "");
  //console.log(filtro_cliente + ' - ' + filtro_da_data);

  //recupero i dati da mostrare
  var situazione_crediti = JSON.parse(localStorage.getItem('situazione_crediti'));
  var scadenze_altro = situazione_crediti.scadenzario_altro_per_data;

  //svuoto la tabella
  $("#righe > tbody").html("");

  //riordino per data scadenza
  $.each( scadenze_altro, function( codice, scadenze_altro_data ){

    var totale_raggruppamento = 0;
    $.each( scadenze_altro_data, function( codice, scadenza ){

      //recupero codice_cliente e data_scadenza
      var codice_cliente = scadenza.codice_cliente;
      var data_scadenza = date_format(scadenza.data_scadenza, 'dd/mm/yyyy', 'yyyymmdd');

      if(
				((filtro_cliente != "" && filtro_cliente == codice_cliente) || filtro_cliente == '') 
				&& 
				((filtro_da_data != "" && filtro_da_data <= data_scadenza) || filtro_da_data == '')
			){

        var riga = "<tr>" +
                      "<td>" + scadenza.ragione_sociale_cliente + "</td>" + 
                      "<td align=center >" + scadenza.data_scadenza + "</td>" + 
                      "<td align=center >" + scadenza.modalita_incasso + "</td>" + 
                      "<td align=right >" + number_format(scadenza.importo_effetto,2,',','.') + "</td>" + 
                      "<td align=center >" + scadenza.numero_documento + "<br/>" + scadenza.data_documento + "</td>" + 
                  "</tr>";

              //mostro la riga
              $('#righe tbody').append(riga);

              totale_data = scadenza.data_scadenza;
              totale_raggruppamento+= (scadenza.importo_effetto)*1;

      }
      
    });

    if(totale_raggruppamento != 0){

      //totale per gruppo
      var totale = "<tr class=\"totale\" >" +
                    "<td colspan=3 > TOTALE AL " + totale_data + "</td>" + 
                    "<td align=right >" + number_format(totale_raggruppamento,2,',','.') + "</td>" + 
                    "<td></td>" +  
                "</tr>" +
                "<tr><td colspan=5 ></td></tr>";
      //mostro il totale
      $('#righe tbody').append(totale);

    }

  });

}