Rails.application.routes.draw do
  root 'static_pages#home'

  get '/mastermind', to: 'mastermind#new'
  get '/signup', to: 'users#new'
  post '/signup', to: 'users#create'

  get '/login', to: 'sessions#new'
  post '/login', to: 'sessions#create'
  delete '/logout', to: 'sessions#destroy'

  get '/mini_reddit', to: 'posts#index'
  get '/mini_reddit/new', to: 'posts#new'
  post '/mini_reddit/new', to: 'posts#create'
  get '/mini_reddit/posts/:id', to: 'posts#show', as: 'post_show'
  get '/mini_reddit/posts/:id/edit', to: 'posts#edit'
  put '/mini_reddit/posts/:id', to: 'posts#update'
  patch '/mini_reddit/posts/:id', to: 'posts#update', as: 'post_update'
  delete '/mini_reddit/posts/:id', to: 'posts#destroy', as: 'post_destroy'

  post '/mini_reddit/posts/:post_id', to: 'comments#create', as: 'comment_create'
  delete '/mini_reddit/posts/:post_id/comments/:id', to: 'comments#destroy', as: 'comment_destroy'


  post '/mini_reddit/posts/:post_id/comments/:comment_id', to: 'comments#create', as: 'reply_create'
  delete '/mini_reddit/posts/:post_id/comments/:comment_id/reply/:id', to: 'comments#destroy', as: 'reply_destroy'


  resources :users
  resources :account_activations, only: [:edit]
  resources :password_resets, only: [:new, :create, :edit, :update]
end
