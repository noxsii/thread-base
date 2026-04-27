revoke delete on table "public"."User" from "anon";

revoke insert on table "public"."User" from "anon";

revoke references on table "public"."User" from "anon";

revoke select on table "public"."User" from "anon";

revoke trigger on table "public"."User" from "anon";

revoke truncate on table "public"."User" from "anon";

revoke update on table "public"."User" from "anon";

revoke delete on table "public"."User" from "authenticated";

revoke insert on table "public"."User" from "authenticated";

revoke references on table "public"."User" from "authenticated";

revoke select on table "public"."User" from "authenticated";

revoke trigger on table "public"."User" from "authenticated";

revoke truncate on table "public"."User" from "authenticated";

revoke update on table "public"."User" from "authenticated";

revoke delete on table "public"."User" from "service_role";

revoke insert on table "public"."User" from "service_role";

revoke references on table "public"."User" from "service_role";

revoke select on table "public"."User" from "service_role";

revoke trigger on table "public"."User" from "service_role";

revoke truncate on table "public"."User" from "service_role";

revoke update on table "public"."User" from "service_role";

alter table "public"."User" drop constraint "User_pkey";

drop index if exists "public"."User_pkey";

drop table "public"."User";


