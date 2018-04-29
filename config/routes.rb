Rails.application.routes.draw do

  root 'static_pages#home'
  
  get '/mastermind', to: 'mastermind#new'
  get '/mini_reddit', to: 'mini_reddit#index'
  get '/signup', to: 'users#new'
end
