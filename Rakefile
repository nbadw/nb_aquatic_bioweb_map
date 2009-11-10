# encoding: utf-8
namespace :application do
  desc "Package application files"
  task :package_all => [:package_js, :package_css]

  desc "Package application javascripts"
  task :package_js do
    puts '--- packaging javascripts ---'
    sh 'juicer merge public/js/application.js --force'
  end

  desc "Package application stylesheets"
  task :package_css do
    puts '--- packaging stylesheets ---'
    sh 'juicer merge public/css/application.css --force'
  end

  desc "Switch to development mode"
  task :use_development do
    use_environment('development')
  end

  desc "Switch to production mode"
  task :use_production do
    use_environment('production')
  end

  desc "Switch to maintenance mode"
  task :use_maintenance do
    maintenance_file = File.dirname(__FILE__) + '/public/maintenance.html'
    app_file = File.dirname(__FILE__) + '/public/index.html'
    File.open(app_file, 'w+') do |app|
      maintenance = IO.readlines(maintenance_file).join
      if downtime = ENV['DOWNTIME']
        downtime_msg = "Scheduled downtime: #{ENV['DOWNTIME']}"
      else
        downtime_msg = "Please check back at a later time."
      end
      app << maintenance.sub("<!-- DOWNTIME_MESSAGE -->", downtime_msg)
    end
  end

  def use_environment(env)
    template = File.dirname(__FILE__) + '/public/env.html'
    app_file = File.dirname(__FILE__) + '/public/index.html'
    env_file = File.dirname(__FILE__) + "/public/env/#{env}.html"

    File.open(app_file, 'w+') do |app|
      content = IO.readlines(template).join
      env = IO.readlines(env_file).join
      app << content.sub("<!-- ENV -->", env)
    end
  end

  desc "restart application"
  task :restart do
    sh "touch #{File.dirname(__FILE__)}/tmp/restart.txt"
  end
end