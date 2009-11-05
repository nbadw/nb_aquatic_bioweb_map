namespace :package do
  desc "Package all files"
  task :all => ['package:css', 'package:js']

  desc "Package application stylesheets"
  task :css do
    puts '--- packaging stylesheets ---'
    sh 'juicer merge public/css/application.css --force'
  end

  desc "Package application javascripts"
  task :js do
    puts '--- packaging javascripts ---'
    sh 'juicer merge public/js/application.js --force'
  end
end