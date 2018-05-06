class Comment < ApplicationRecord
  validates :comment, presence: true
  belongs_to :user
  belongs_to :post
  has_many :comments
end
