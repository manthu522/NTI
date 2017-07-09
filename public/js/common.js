
$(document).ready(function () {
   var socket = io();
  /* function for communication between client and server  */
  socket.on('test', function (res) {
    var str = '';
    if(res.message.length > 0){
        $.each(res.message, function(i, schedule){
          var mints = schedule.arriaval > 1 ? 'mins' : 'min';
          if(schedule.arriaval <= 15 && i <= 2){
            str += '<tr> <td>'+(i+1)+'</td> <td>'+schedule.destination+'</td><td>'+schedule.arriaval+' '+mints+'</td>';
          }
        });
    }else{
      str += '<tr> <td> - </td> <td> - </td> <td> - </td></tr> <tr> <td> - </td> <td> - </td> <td> - </td></tr>';
    }
    str += '<tr> <td></td> <td>'+res.currentTime+'</td><td></td></tr>';
    $('#scheduleBody').html(str);
  });
});
