# encoding: utf-8
desc "restart server"
task :restart do
  sh "touch #{File.dirname(__FILE__)}/tmp/restart.txt"
end

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