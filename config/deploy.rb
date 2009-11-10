set :application,  "nb_aquatic_bioweb_map"
set :user,         "colin"
set :use_sudo,     false
set :deploy_to,    "/var/www/apps/#{application}"

# svn settings
set :scm,          :subversion
set :repository,   "http://subversion.assembla.com/svn/#{application}/trunk"

# roles
role :web,         "cri-linux.nbwaters.unb.ca"
role :app,         "cri-linux.nbwaters.unb.ca"
role :db,          "cri-linux.nbwaters.unb.ca", :primary => true

namespace :deploy do
  task :start, :roles => :app do
    run "touch #{current_release}/tmp/restart.txt"
  end

  task :stop, :roles => :app do
    # Do nothing.
  end

  desc "Restart Application"
  task :restart, :roles => :app do
    run "touch #{current_release}/tmp/restart.txt"
  end

  task :after_symlink do
    use_production
  end

  desc "Switch to production mode"
  task :use_production, :roles => :app do
    run("cd #{deploy_to}/current; rake application:use_production")
  end

  desc "Switch to development mode"
  task :use_development, :roles => :app do
    run("cd #{deploy_to}/current; rake application:use_development")
  end

  desc "Switch to maintenance mode"
  task :use_maintenance, :roles => :app do
    run("cd #{deploy_to}/current; rake application:use_maintenance")
  end
end
