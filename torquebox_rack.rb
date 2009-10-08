# encoding: utf-8
gem 'torquebox-rails'
require 'torquebox/tasks/rake_utils'
require 'torquebox/tasks/jboss_as'

module JBoss
  module RakeUtils
    def self.deploy(app_name, rack_root, context_path = '/')
      deployment_descriptor = {
        'application' => {
          'RACK_ROOT'=>rack_root,
          'RACK_ENV'=>RACK_ENV,
        },
        'web' => {
          'context'=> context_path[0,1] != '/'? %Q(/#{context_path}) : context_path
        }
      }
      deployment = "#{deploy_dir}/#{app_name}-rack.yml"
      File.open( deployment, 'w' ) do |file|
        YAML.dump( deployment_descriptor, file )
      end
    end

    def self.undeploy(app_name)
      deployment = "#{deploy_dir}/#{app_name}-rack.yml"
      FileUtils.rm_rf( deployment )
    end
  end
end


