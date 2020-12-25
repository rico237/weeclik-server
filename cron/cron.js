module.exports = function(app){

  const cron          = require('node-cron');
  let moment          = require('moment');
  let Parse           = require('parse/node');

  // Toute les heure à 0 minute
  // '* * 1 * *' tous les mois ?
  // '* * * * *'
  // cron.schedule('*/10 * * * * *', async () => {
  cron.schedule('0 * * * *', async () => {
  // Chaque heure à 0 (01:00, 15:00, etc)
    // TODO: Ecrire fonction pour ecriture de log
    // TODO: Envoi de mail à chaque commerce passant en mode desactivé (user & admin)
    const functionName = 'endedSubscription';
    console.log(`Function ${functionName} executé à ${moment()}`);
    const commerces = await Parse.Cloud.run(functionName);
    console.log("Successfully retrieved " + commerces.length + " commerces.");

    for (let i = 0; i < commerces.length; i++) {
      let object = commerces[i];
      if (moment(object.get('endSubscription')).isValid()) {
        let day =  moment(object.get('endSubscription'));
        if (moment().isSameOrAfter(day)) {
          console.log(object.get('nomCommerce') +  ' passed date');
          object.set("statutCommerce", 0);
          await object.save(null, {useMasterKey:true});
        }
      }
    }
  });

}