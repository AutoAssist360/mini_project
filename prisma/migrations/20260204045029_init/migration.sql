-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'technician', 'admin');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('petrol', 'diesel', 'electric', 'hybrid');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('manual', 'automatic', 'semi_automatic');

-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('engine', 'tyre', 'brake', 'electrical', 'accident', 'general');

-- CreateEnum
CREATE TYPE "ServiceLocation" AS ENUM ('roadside', 'home', 'office');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('created', 'technician_notified', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video');

-- CreateEnum
CREATE TYPE "TechType" AS ENUM ('individual', 'garage');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "RepairMode" AS ENUM ('on_road', 'towed_to_garage');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('en_route', 'repairing', 'waiting_for_parts', 'completed');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('part', 'labor', 'towing', 'fee');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "car_companies" (
    "company_id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,

    CONSTRAINT "car_companies_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "car_models" (
    "model_id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "model_name" TEXT NOT NULL,

    CONSTRAINT "car_models_pkey" PRIMARY KEY ("model_id")
);

-- CreateTable
CREATE TABLE "car_variants" (
    "variant_id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "engine_type" TEXT NOT NULL,
    "fuel_type" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,

    CONSTRAINT "car_variants_pkey" PRIMARY KEY ("variant_id")
);

-- CreateTable
CREATE TABLE "user_vehicles" (
    "vehicle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "registration_number" TEXT NOT NULL,
    "vin_number" TEXT NOT NULL,

    CONSTRAINT "user_vehicles_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateTable
CREATE TABLE "car_part_categories" (
    "category_id" SERIAL NOT NULL,
    "category_name" TEXT NOT NULL,

    CONSTRAINT "car_part_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "car_parts" (
    "part_id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "part_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "car_parts_pkey" PRIMARY KEY ("part_id")
);

-- CreateTable
CREATE TABLE "part_prices" (
    "price_id" SERIAL NOT NULL,
    "part_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "warranty_months" INTEGER NOT NULL,

    CONSTRAINT "part_prices_pkey" PRIMARY KEY ("price_id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "issue_description" TEXT NOT NULL,
    "issue_type" "IssueType" NOT NULL,
    "breakdown_latitude" DECIMAL(9,6) NOT NULL,
    "breakdown_longitude" DECIMAL(9,6) NOT NULL,
    "service_location_type" "ServiceLocation" NOT NULL,
    "requires_towing" BOOLEAN NOT NULL DEFAULT false,
    "status" "RequestStatus" NOT NULL DEFAULT 'created',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "service_request_parts" (
    "id" SERIAL NOT NULL,
    "request_id" TEXT NOT NULL,
    "part_id" INTEGER NOT NULL,
    "problem_description" TEXT NOT NULL,

    CONSTRAINT "service_request_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_media" (
    "media_id" SERIAL NOT NULL,
    "request_id" TEXT NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "media_url" TEXT NOT NULL,

    CONSTRAINT "service_request_media_pkey" PRIMARY KEY ("media_id")
);

-- CreateTable
CREATE TABLE "technician_profiles" (
    "tech_id" TEXT NOT NULL,
    "technician_type" "TechType" NOT NULL,
    "business_name" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "current_lat" DECIMAL(9,6),
    "current_long" DECIMAL(9,6),
    "service_radius_km" INTEGER NOT NULL,
    "rating_average" DECIMAL(2,1) NOT NULL DEFAULT 0,

    CONSTRAINT "technician_profiles_pkey" PRIMARY KEY ("tech_id")
);

-- CreateTable
CREATE TABLE "technician_car_supports" (
    "id" SERIAL NOT NULL,
    "tech_id" TEXT NOT NULL,
    "company_id" INTEGER NOT NULL,
    "experience_years" INTEGER NOT NULL,

    CONSTRAINT "technician_car_supports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_part_skills" (
    "id" SERIAL NOT NULL,
    "tech_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "technician_part_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_certifications" (
    "cert_id" SERIAL NOT NULL,
    "tech_id" TEXT NOT NULL,
    "certificate_name" TEXT NOT NULL,
    "issued_by" TEXT NOT NULL,
    "valid_till" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technician_certifications_pkey" PRIMARY KEY ("cert_id")
);

-- CreateTable
CREATE TABLE "technician_resources" (
    "resource_id" SERIAL NOT NULL,
    "tech_id" TEXT NOT NULL,
    "has_service_van" BOOLEAN NOT NULL DEFAULT false,
    "has_tow_truck" BOOLEAN NOT NULL DEFAULT false,
    "has_garage" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "technician_resources_pkey" PRIMARY KEY ("resource_id")
);

-- CreateTable
CREATE TABLE "technician_offers" (
    "offer_id" SERIAL NOT NULL,
    "request_id" TEXT NOT NULL,
    "tech_id" TEXT NOT NULL,
    "estimated_cost" DECIMAL(10,2) NOT NULL,
    "estimated_time_minutes" INTEGER NOT NULL,
    "offer_status" "OfferStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "technician_offers_pkey" PRIMARY KEY ("offer_id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "job_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "tech_id" TEXT NOT NULL,
    "repair_mode" "RepairMode" NOT NULL,
    "job_status" "JobStatus" NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "platform_messages" (
    "message_id" SERIAL NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "message_text" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "invoice_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "labor_cost" DECIMAL(10,2) NOT NULL,
    "parts_cost" DECIMAL(10,2) NOT NULL,
    "towing_cost" DECIMAL(10,2) NOT NULL,
    "platform_fee" DECIMAL(10,2) NOT NULL,
    "travel_cost" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "item_id" SERIAL NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "review_id" SERIAL NOT NULL,
    "job_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tech_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "car_companies_company_name_key" ON "car_companies"("company_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_vehicles_registration_number_key" ON "user_vehicles"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "user_vehicles_vin_number_key" ON "user_vehicles"("vin_number");

-- CreateIndex
CREATE UNIQUE INDEX "technician_resources_tech_id_key" ON "technician_resources"("tech_id");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_request_id_key" ON "jobs"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_job_id_key" ON "invoices"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_job_id_key" ON "reviews"("job_id");

-- AddForeignKey
ALTER TABLE "car_models" ADD CONSTRAINT "car_models_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "car_companies"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_variants" ADD CONSTRAINT "car_variants_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vehicles" ADD CONSTRAINT "user_vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vehicles" ADD CONSTRAINT "user_vehicles_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_parts" ADD CONSTRAINT "car_parts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "car_part_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_prices" ADD CONSTRAINT "part_prices_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "car_parts"("part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_prices" ADD CONSTRAINT "part_prices_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "user_vehicles"("vehicle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_parts" ADD CONSTRAINT "service_request_parts_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_parts" ADD CONSTRAINT "service_request_parts_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "car_parts"("part_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_media" ADD CONSTRAINT "service_request_media_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_profiles" ADD CONSTRAINT "technician_profiles_tech_id_fkey" FOREIGN KEY ("tech_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_car_supports" ADD CONSTRAINT "technician_car_supports_tech_id_fkey" FOREIGN KEY ("tech_id") REFERENCES "technician_profiles"("tech_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_car_supports" ADD CONSTRAINT "technician_car_supports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "car_companies"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_part_skills" ADD CONSTRAINT "technician_part_skills_tech_id_fkey" FOREIGN KEY ("tech_id") REFERENCES "technician_profiles"("tech_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_part_skills" ADD CONSTRAINT "technician_part_skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "car_part_categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_certifications" ADD CONSTRAINT "technician_certifications_tech_id_fkey" FOREIGN KEY ("tech_id") REFERENCES "technician_profiles"("tech_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_resources" ADD CONSTRAINT "technician_resources_tech_id_fkey" FOREIGN KEY ("tech_id") REFERENCES "technician_profiles"("tech_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_offers" ADD CONSTRAINT "technician_offers_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_offers" ADD CONSTRAINT "technician_offers_tech_id_fkey" FOREIGN KEY ("tech_id") REFERENCES "technician_profiles"("tech_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_tech_id_fkey" FOREIGN KEY ("tech_id") REFERENCES "technician_profiles"("tech_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_messages" ADD CONSTRAINT "platform_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_messages" ADD CONSTRAINT "platform_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_messages" ADD CONSTRAINT "platform_messages_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("job_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("job_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tech_id_fkey" FOREIGN KEY ("tech_id") REFERENCES "technician_profiles"("tech_id") ON DELETE RESTRICT ON UPDATE CASCADE;
